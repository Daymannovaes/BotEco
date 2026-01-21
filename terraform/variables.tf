variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Name of the LKE cluster"
  type        = string
  default     = "wpp-bot-cluster"
}

variable "region" {
  description = "Linode region for the cluster"
  type        = string
  default     = "us-east" # Newark, NJ
}

variable "k8s_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.33"
}

variable "node_type" {
  description = "Linode instance type for worker nodes"
  type        = string
  default     = "g6-standard-2" # 4GB RAM, 2 vCPU - upgrade to g6-standard-4 (8GB) for production
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 3
}

variable "storage_size_gb" {
  description = "Size of the block storage volume in GB"
  type        = number
  default     = 20
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = ["wpp-bot", "production"]
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}
