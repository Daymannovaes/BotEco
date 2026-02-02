terraform {
  required_version = ">= 1.0"

  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 2.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}

# Linode Nanode VPS
resource "linode_instance" "wpp_bot" {
  label           = var.vps_label
  region          = var.region
  type            = var.vps_type
  image           = "linode/ubuntu24.04"
  authorized_keys = [var.ssh_public_key]
  tags            = var.tags

  metadata {
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {
      ssh_public_key = var.ssh_public_key
    }))
  }
}

# Firewall for VPS
resource "linode_firewall" "wpp_bot" {
  label = "${var.vps_label}-firewall"

  inbound {
    label    = "allow-ssh"
    action   = "ACCEPT"
    protocol = "TCP"
    ports    = "22"
    ipv4     = ["0.0.0.0/0"]
    ipv6     = ["::/0"]
  }

  inbound {
    label    = "allow-http"
    action   = "ACCEPT"
    protocol = "TCP"
    ports    = "80"
    ipv4     = ["0.0.0.0/0"]
    ipv6     = ["::/0"]
  }

  inbound {
    label    = "allow-https"
    action   = "ACCEPT"
    protocol = "TCP"
    ports    = "443"
    ipv4     = ["0.0.0.0/0"]
    ipv6     = ["::/0"]
  }

  inbound_policy  = "DROP"
  outbound_policy = "ACCEPT"

  linodes = [linode_instance.wpp_bot.id]
}
