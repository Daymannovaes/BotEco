output "cluster_id" {
  description = "ID of the LKE cluster"
  value       = linode_lke_cluster.wpp_bot.id
}

output "cluster_status" {
  description = "Status of the LKE cluster"
  value       = linode_lke_cluster.wpp_bot.status
}

output "api_endpoints" {
  description = "API endpoints for the LKE cluster"
  value       = linode_lke_cluster.wpp_bot.api_endpoints
}

output "kubeconfig_path" {
  description = "Path to the kubeconfig file"
  value       = local_file.kubeconfig.filename
}

output "volume_id" {
  description = "ID of the block storage volume"
  value       = linode_volume.wpp_bot_data.id
}

output "pool_id" {
  description = "ID of the node pool"
  value       = linode_lke_cluster.wpp_bot.pool[0].id
}
