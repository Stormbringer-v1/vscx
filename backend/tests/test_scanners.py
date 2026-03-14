import pytest
from app.services.scanners import (
    is_loopback_ip, is_private_ip, is_in_private_range,
    is_valid_target, validate_targets
)
from unittest.mock import patch, MagicMock


class TestIPValidation:
    def test_loopback_ips(self):
        assert is_loopback_ip("127.0.0.1") is True
        assert is_loopback_ip("::1") is True
        assert is_loopback_ip("127.0.0.2") is True

    def test_non_loopback_ips(self):
        assert is_loopback_ip("192.168.1.1") is False
        assert is_loopback_ip("8.8.8.8") is False

    def test_private_ips_10_range(self):
        assert is_private_ip("10.0.0.1") is True
        assert is_private_ip("10.255.255.255") is True

    def test_private_ips_172_range(self):
        assert is_private_ip("172.16.0.1") is True
        assert is_private_ip("172.31.255.255") is True

    def test_private_ips_192_range(self):
        assert is_private_ip("192.168.0.1") is True
        assert is_private_ip("192.168.255.255") is True

    def test_public_ips(self):
        assert is_private_ip("8.8.8.8") is False
        assert is_private_ip("1.1.1.1") is False
        assert is_private_ip("203.0.113.1") is False

    def test_private_ranges(self):
        assert is_in_private_range("10.0.0.1") is True
        assert is_in_private_range("172.16.0.1") is True
        assert is_in_private_range("192.168.1.1") is True
        assert is_in_private_range("8.8.8.8") is False


class TestTargetValidation:
    def test_reject_loopback(self):
        is_valid, error = is_valid_target("127.0.0.1")
        assert is_valid is False
        assert "loopback" in error.lower()

    def test_reject_localhost(self):
        is_valid, error = is_valid_target("localhost")
        assert is_valid is False

    def test_reject_private_when_not_allowed(self, monkeypatch):
        monkeypatch.setattr("app.services.scanners.settings", MagicMock(ALLOW_PRIVATE_TARGETS=False))
        is_valid, error = is_valid_target("192.168.1.1")
        assert is_valid is False
        assert "private" in error.lower()

    def test_allow_private_when_enabled(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=True)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error = is_valid_target("192.168.1.1")
        assert is_valid is True
        assert error == ""

    def test_valid_public_ip(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=False)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error = is_valid_target("8.8.8.8")
        assert is_valid is True


class TestValidateTargets:
    def test_single_valid_target(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=False)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error, targets = validate_targets("8.8.8.8")
        assert is_valid is True
        assert targets == ["8.8.8.8"]

    def test_multiple_valid_targets(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=False)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error, targets = validate_targets("8.8.8.8, 1.1.1.1")
        assert is_valid is True
        assert targets == ["8.8.8.8", "1.1.1.1"]

    def test_mixed_valid_invalid_targets(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=False)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error, targets = validate_targets("8.8.8.8, 127.0.0.1")
        assert is_valid is False
        assert "loopback" in error.lower()

    def test_whitespace_handling(self, monkeypatch):
        mock_settings = MagicMock(ALLOW_PRIVATE_TARGETS=False)
        monkeypatch.setattr("app.services.scanners.settings", mock_settings)
        is_valid, error, targets = validate_targets("  8.8.8.8  ,  1.1.1.1  ")
        assert is_valid is True
        assert len(targets) == 2