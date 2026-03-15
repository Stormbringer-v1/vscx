SCAN_PROFILES = {
    "quick": {
        "label": "Quick Scan",
        "description": "Fast port scan and service detection. Runs in under 2 minutes.",
        "steps": [
            {"scanner": "nmap", "options": "-sn -T4"},
        ],
        "timeout": 120,
    },
    "standard": {
        "label": "Standard Scan",
        "description": "Port scan with service detection and common vulnerability checks.",
        "steps": [
            {"scanner": "nmap", "options": "-sV -sC -T3 --top-ports 1000"},
            {"scanner": "nuclei", "options": "-severity critical,high"},
        ],
        "timeout": 600,
    },
    "aggressive": {
        "label": "Aggressive Scan",
        "description": "Full port scan, OS detection, all vulnerability checks. Can take 10+ minutes.",
        "steps": [
            {"scanner": "nmap", "options": "-sV -sC -O -T4 -p-"},
            {"scanner": "nuclei", "options": "-severity critical,high,medium,low"},
        ],
        "timeout": 1800,
    },
    "container": {
        "label": "Container Scan",
        "description": "Scan container images for vulnerabilities and misconfigurations.",
        "steps": [
            {"scanner": "trivy", "options": "--severity HIGH,CRITICAL"},
        ],
        "timeout": 600,
    },
}
