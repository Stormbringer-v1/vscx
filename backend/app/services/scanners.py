import asyncio
import json
import ipaddress
import re
import socket
from typing import List, Dict, Any
from datetime import datetime

from app.core.config import settings


def is_loopback_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_loopback
    except ValueError:
        return False


def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private
    except ValueError:
        return False


def is_in_private_range(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        private_ranges = [
            ipaddress.ip_network("10.0.0.0/8"),
            ipaddress.ip_network("172.16.0.0/12"),
            ipaddress.ip_network("192.168.0.0/16"),
        ]
        return any(ip in network for network in private_ranges)
    except ValueError:
        return False


def is_valid_target(target: str) -> tuple[bool, str]:
    target = target.strip()
    
    if target.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        return False, f"Target '{target}' is a loopback address and is not allowed"
    
    if is_loopback_ip(target):
        return False, f"Target '{target}' resolves to a loopback address"
    
    if not settings.ALLOW_PRIVATE_TARGETS:
        if is_private_ip(target) or is_in_private_range(target):
            return False, f"Target '{target}' is in a private IP range. Set ALLOW_PRIVATE_TARGETS=true to allow"
    
    hostname_pattern = re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$')
    if not hostname_pattern.match(target):
        if not target.replace(".", "").replace("-", "").replace("_", "").isalnum():
            return False, f"Target '{target}' contains invalid characters"
    
    try:
        resolved = socket.gethostbyname(target)
        if is_loopback_ip(resolved):
            return False, f"Target '{target}' resolves to loopback address"
    except socket.gaierror:
        pass
    
    return True, ""


def validate_targets(targets: str) -> tuple[bool, str, List[str]]:
    target_list = [t.strip() for t in targets.split(",") if t.strip()]
    invalid_targets = []
    
    for target in target_list:
        is_valid, error_msg = is_valid_target(target)
        if not is_valid:
            invalid_targets.append(error_msg)
    
    if invalid_targets:
        return False, "; ".join(invalid_targets), []
    
    return True, "", target_list


class ScannerBase:
    @staticmethod
    async def run_command(cmd: List[str], timeout: int = 300) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
            
            return {
                "returncode": process.returncode,
                "stdout": stdout.decode("utf-8", errors="ignore"),
                "stderr": stderr.decode("utf-8", errors="ignore"),
                "success": process.returncode == 0
            }
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return {"error": "Command timed out", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


class NmapScanner(ScannerBase):
    SCAN_TYPE = "nmap"
    
    @staticmethod
    async def scan(targets: str, options: str = "-sV -T4") -> Dict[str, Any]:
        cmd = ["nmap", *options.split(), "-oX", "-", targets]
        result = await NmapScanner.run_command(cmd)
        
        if result.get("success"):
            try:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(result["stdout"])
                findings = []
                
                for host in root.findall(".//host"):
                    addr = host.find("address").get("addr")
                    ports = []
                    for port in host.findall(".//port"):
                        port_id = port.get("portid")
                        proto = port.get("protocol")
                        state = port.find("service").get("state") if port.find("service") is not None else "unknown"
                        service = port.find("service").get("name") if port.find("service") is not None else "unknown"
                        version = port.find("service").get("version") or ""
                        
                        ports.append({
                            "port": port_id,
                            "protocol": proto,
                            "state": state,
                            "service": service,
                            "version": version
                        })
                        
                        if state == "open":
                            findings.append({
                                "title": f"Open {service} port {port_id}",
                                "description": f"Service: {service} {version}".strip(),
                                "severity": "medium",
                                "affected_component": f"{addr}:{port_id}"
                            })
                    
                    if not ports:
                        findings.append({
                            "title": f"Host {addr} is up",
                            "description": f"Host is reachable",
                            "severity": "info",
                            "affected_component": addr
                        })
                
                return {"findings": findings, "success": True}
            except Exception as e:
                return {"error": f"Failed to parse nmap output: {e}", "success": False}
        
        return result


class NucleiScanner(ScannerBase):
    SCAN_TYPE = "nuclei"
    
    @staticmethod
    async def scan(targets: str, options: str = "-severity critical,high,medium") -> Dict[str, Any]:
        cmd = ["nuclei", "-u", targets] + options.split() + ["-json-export", "-"]
        result = await NucleiScanner.run_command(cmd, timeout=600)
        
        if result.get("success"):
            findings = []
            for line in result["stdout"].strip().split("\n"):
                if not line.strip():
                    continue
                try:
                    parsed = json.loads(line)
                    findings.append({
                        "title": parsed.get("info", {}).get("name", "Unknown"),
                        "description": parsed.get("info", {}).get("description", ""),
                        "severity": parsed.get("info", {}).get("severity", "medium").lower(),
                        "cve_id": parsed.get("info", {}).get("cve_id", [None])[0],
                        "matched_at": parsed.get("matched-at", ""),
                        "affected_component": parsed.get("host", "")
                    })
                except json.JSONDecodeError:
                    continue
            
            return {"findings": findings, "success": True}
        
        return result


class TrivyScanner(ScannerBase):
    SCAN_TYPE = "trivy"
    
    @staticmethod
    async def scan(targets: str, options: str = "--severity HIGH,CRITICAL") -> Dict[str, Any]:
        cmd = ["trivy", "image", "--format", "json", "--quiet"] + options.split() + [targets]
        result = await TrivyScanner.run_command(cmd, timeout=600)
        
        if result.get("success"):
            try:
                vuln_data = json.loads(result["stdout"])
                findings = []
                
                for result_item in vuln_data.get("Results", []):
                    for vuln in result_item.get("Vulnerabilities", []):
                        findings.append({
                            "title": vuln.get("VulnerabilityID", "Unknown"),
                            "description": vuln.get("Description", ""),
                            "severity": vuln.get("Severity", "medium").lower(),
                            "cve_id": vuln.get("VulnerabilityID"),
                            "cvss_score": vuln.get("CVSS", {}).get("V3Score", 0),
                            "affected_component": f"{result_item.get('Type', 'image')}:{result_item.get('Target', targets)}",
                            "installed_version": vuln.get("InstalledVersion", ""),
                            "fixed_version": vuln.get("FixedVersion", "")
                        })
                    
                    for misconf in result_item.get("Misconfigurations", []):
                        findings.append({
                            "title": misconf.get("ID", "Unknown"),
                            "description": misconf.get("Description", ""),
                            "severity": misconf.get("Severity", "medium").lower(),
                            "affected_component": f"{result_item.get('Type', 'misconfig')}:{result_item.get('Target', targets)}"
                        })
                
                return {"findings": findings, "success": True}
            except json.JSONDecodeError as e:
                return {"error": f"Failed to parse trivy output: {e}", "success": False}
        
        return result


SCANNERS = {
    "nmap": NmapScanner,
    "nuclei": NucleiScanner,
    "trivy": TrivyScanner
}


async def run_scan(scan_type: str, targets: str, options: str = "") -> Dict[str, Any]:
    is_valid, error_msg, validated_targets = validate_targets(targets)
    if not is_valid:
        return {"error": error_msg, "success": False}
    
    scanner = SCANNERS.get(scan_type.lower())
    if not scanner:
        return {"error": f"Unknown scanner: {scan_type}", "success": False}
    
    return await scanner.scan(",".join(validated_targets), options)
