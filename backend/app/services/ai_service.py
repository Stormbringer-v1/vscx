import httpx
from typing import Dict, Any, List, Optional
import os


class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def generate_remediation_suggestion(
        self,
        cve_id: Optional[str],
        title: str,
        description: str,
        severity: str,
        affected_component: str,
        cvss_score: Optional[float] = None
    ) -> Dict[str, Any]:
        severity_priority = {
            "critical": "IMMEDIATE",
            "high": "URGENT",
            "medium": "SOON",
            "low": "SCHEDULED",
            "info": "OPTIONAL"
        }
        
        remediation_templates = {
            "critical": {
                "priority": "CRITICAL - Address immediately",
                "actions": [
                    "Isolate affected system from network",
                    "Apply available patch or mitigation",
                    "Review access logs for compromise indicators",
                    "Implement additional monitoring",
                    "Plan for potential incident response"
                ],
                "timeline": "Within 24-48 hours"
            },
            "high": {
                "priority": "HIGH - Address within days",
                "actions": [
                    "Schedule patch deployment",
                    "Implement compensating controls",
                    "Review and restrict access",
                    "Increase logging and monitoring",
                    "Test remediation in staging environment"
                ],
                "timeline": "Within 1 week"
            },
            "medium": {
                "priority": "MEDIUM - Address in regular cycle",
                "actions": [
                    "Add to next maintenance window",
                    "Document workaround if available",
                    "Review vulnerability details",
                    "Assess false positive probability"
                ],
                "timeline": "Within 30 days"
            },
            "low": {
                "priority": "LOW - Address when convenient",
                "actions": [
                    "Add to regular update cycle",
                    "Document for awareness",
                    "Review in next planning cycle"
                ],
                "timeline": "Within 90 days"
            },
            "info": {
                "priority": "INFORMATIONAL",
                "actions": [
                    "Review for awareness",
                    "Document if relevant to environment"
                ],
                "timeline": "No immediate action required"
            }
        }
        
        severity_key = severity.lower() if severity.lower() in remediation_templates else "info"
        template = remediation_templates.get(severity_key, remediation_templates["info"])
        
        component_type = self._identify_component_type(affected_component)
        specific_guidance = self._get_component_guidance(component_type)
        
        return {
            "cve_id": cve_id,
            "title": title,
            "severity": severity.upper(),
            "priority": template["priority"],
            "recommended_actions": template["actions"],
            "specific_guidance": specific_guidance,
            "timeline": template["timeline"],
            "cvss_score": cvss_score,
            "risk_summary": self._generate_risk_summary(severity, cvss_score, affected_component)
        }
    
    def _identify_component_type(self, component: str) -> str:
        component_lower = component.lower()
        if any(x in component_lower for x in ["nginx", "apache", "httpd", "iis", "web server"]):
            return "web_server"
        if any(x in component_lower for x in ["mysql", "postgresql", "mongodb", "redis", "database"]):
            return "database"
        if any(x in component_lower for x in ["openssl", "openssl", "lib", "library"]):
            return "library"
        if any(x in component_lower for x in ["ssh", "openssh", "telnet", "ftp"]):
            return "network_service"
        if any(x in component_lower for x in ["docker", "container", "kubernetes", "k8s"]):
            return "container"
        if any(x in component_lower for x in ["linux", "kernel", "ubuntu", "debian", "centos"]):
            return "os"
        return "general"
    
    def _get_component_guidance(self, component_type: str) -> Dict[str, str]:
        guidance = {
            "web_server": {
                "update": "Update web server to latest version",
                "config": "Review and harden server configuration",
                "monitor": "Enable detailed request logging"
            },
            "database": {
                "update": "Apply database security patches",
                "config": "Review user permissions and network access",
                "monitor": "Enable audit logging for sensitive queries"
            },
            "library": {
                "update": "Update library via package manager",
                "config": "Review dependency tree for vulnerable versions",
                "monitor": "Use Software Composition Analysis tools"
            },
            "network_service": {
                "update": "Update service daemon to latest version",
                "config": "Disable unused services, use key-based auth",
                "monitor": "Monitor failed authentication attempts"
            },
            "container": {
                "update": "Rebuild container with updated base image",
                "config": "Run containers as non-root user",
                "monitor": "Use container runtime security tools"
            },
            "os": {
                "update": "Apply OS security updates",
                "config": "Follow CIS benchmarks for system hardening",
                "monitor": "Enable auditd for security events"
            },
            "general": {
                "update": "Check vendor advisory for patch information",
                "config": "Review security configuration",
                "monitor": "Enable comprehensive logging"
            }
        }
        return guidance.get(component_type, guidance["general"])
    
    def _generate_risk_summary(self, severity: str, cvss_score: Optional[float], component: str) -> str:
        score_desc = ""
        if cvss_score:
            if cvss_score >= 9.0:
                score_desc = "Critical severity with exploit potential"
            elif cvss_score >= 7.0:
                score_desc = "High severity requiring attention"
            elif cvss_score >= 4.0:
                score_desc = "Medium severity with limited exploitability"
            else:
                score_desc = "Low severity, minimal immediate risk"
        
        return f"Vulnerability in {component} ({severity.upper()}). {score_desc}. Review and remediate based on priority timeline."
    
    async def generate_batch_remediation(
        self,
        findings: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        results = []
        for finding in findings:
            suggestion = await self.generate_remediation_suggestion(
                cve_id=finding.get("cve_id"),
                title=finding.get("title", ""),
                description=finding.get("description", ""),
                severity=finding.get("severity", "info"),
                affected_component=finding.get("affected_component", ""),
                cvss_score=finding.get("cvss_score")
            )
            results.append(suggestion)
        
        return sorted(results, key=lambda x: (
            ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"].index(x["priority"]) 
            if x["priority"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] 
            else 4
        ))
    
    async def generate_report(
        self,
        project_name: str,
        findings: List[Dict[str, Any]],
        assets_count: int,
        scans_count: int
    ) -> Dict[str, Any]:
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in findings:
            sev = f.get("severity", "info").lower()
            if sev in severity_counts:
                severity_counts[sev] += 1
        
        critical_findings = [f for f in findings if f.get("severity", "").lower() == "critical"]
        high_findings = [f for f in findings if f.get("severity", "").lower() == "high"]
        
        recommendations = []
        if severity_counts["critical"] > 0:
            recommendations.append({
                "priority": "IMMEDIATE",
                "action": f"Address {severity_counts['critical']} critical vulnerabilities within 24-48 hours"
            })
        if severity_counts["high"] > 0:
            recommendations.append({
                "priority": "HIGH",
                "action": f"Plan remediation for {severity_counts['high']} high severity findings"
            })
        if severity_counts["medium"] > 0:
            recommendations.append({
                "priority": "MEDIUM",
                "action": f"Schedule {severity_counts['medium']} medium findings for next maintenance window"
            })
        
        return {
            "report_metadata": {
                "project_name": project_name,
                "generated_at": "2026-03-14T00:00:00Z",
                "period": "Last 30 days"
            },
            "executive_summary": {
                "total_findings": len(findings),
                "total_assets": assets_count,
                "total_scans": scans_count,
                "risk_score": self._calculate_risk_score(severity_counts),
                "status": "ACTION REQUIRED" if severity_counts["critical"] > 0 or severity_counts["high"] > 5 else "MONITOR"
            },
            "findings_breakdown": severity_counts,
            "critical_findings": [
                {
                    "title": f.get("title"),
                    "cve_id": f.get("cve_id"),
                    "severity": f.get("severity"),
                    "affected_component": f.get("affected_component")
                }
                for f in critical_findings[:10]
            ],
            "recommendations": recommendations,
            "next_steps": [
                "Review and validate findings",
                "Create remediation tickets",
                "Schedule maintenance window",
                "Re-scan after remediation"
            ]
        }
    
    def _calculate_risk_score(self, severity_counts: Dict[str, int]) -> float:
        weights = {"critical": 10, "high": 5, "medium": 2, "low": 0.5, "info": 0}
        score = sum(severity_counts.get(sev, 0) * weight for sev, weight in weights.items())
        return min(round(score, 1), 100)
    
    async def close(self):
        await self.client.aclose()


async def get_ai_suggestion(
    cve_id: Optional[str],
    title: str,
    description: str,
    severity: str,
    affected_component: str,
    cvss_score: Optional[float] = None
) -> Dict[str, Any]:
    service = AIService()
    try:
        return await service.generate_remediation_suggestion(
            cve_id, title, description, severity, affected_component, cvss_score
        )
    finally:
        await service.close()
