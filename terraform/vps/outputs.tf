output "vps_ip" {
  description = "Public IP address of the VPS"
  value       = linode_instance.wpp_bot.ip_address
}

output "vps_ipv6" {
  description = "IPv6 address of the VPS"
  value       = linode_instance.wpp_bot.ipv6
}

output "vps_id" {
  description = "Linode instance ID"
  value       = linode_instance.wpp_bot.id
}

output "ssh_command" {
  description = "SSH command to connect to the VPS"
  value       = "ssh deploy@${linode_instance.wpp_bot.ip_address}"
}
