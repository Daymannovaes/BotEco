terraform {
  required_version = ">= 1.0"

  required_providers {
    linode = {
      source  = "linode/linode"
      version = "~> 2.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}

# LKE Cluster
resource "linode_lke_cluster" "wpp_bot" {
  label       = var.cluster_name
  k8s_version = var.k8s_version
  region      = var.region
  tags        = var.tags

  pool {
    type  = var.node_type
    count = var.node_count

    autoscaler {
      min = var.node_count
      max = var.max_node_count
    }
  }

  control_plane {
    high_availability = false
  }
}

# Block Storage Volume for persistent data
resource "linode_volume" "wpp_bot_data" {
  label  = "${var.cluster_name}-data"
  region = var.region
  size   = var.storage_size_gb
  tags   = var.tags
}

# Save kubeconfig to local file
resource "local_file" "kubeconfig" {
  content         = base64decode(linode_lke_cluster.wpp_bot.kubeconfig)
  filename        = "${path.module}/kubeconfig.yaml"
  file_permission = "0600"
}
