output "server_public_ip" {
  description = "Public IP of the deployed application host"
  value       = aws_instance.app_server.public_ip
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "application_url" {
  description = "URL to access the frontend application"
  value       = "http://${aws_instance.app_server.public_ip}:8080"
}

output "grafana_url" {
  description = "URL to access Grafana monitoring"
  value       = "http://${aws_instance.app_server.public_ip}:3000"
}
