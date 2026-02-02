variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "vps_label" {
  description = "Label for the VPS instance"
  type        = string
  default     = "wpp-bot-vps"
}

variable "region" {
  description = "Linode region"
  type        = string
  default     = "us-east"
}

variable "vps_type" {
  description = "Linode instance type (g6-nanode-1 = $5/mo)"
  type        = string
  default     = "g6-nanode-1"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = ["wpp-bot", "production"]
}
