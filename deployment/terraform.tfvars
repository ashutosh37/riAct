subscription_name = "Visual Studio Premium with MSDN"
subscription_id = "dfbf78e0-b5c7-4cc7-bc1c-537a65cc647f"
project_name = "riact_agents"
db_username = "ridb_admin"
db_password = "tS3J83|JH5h<~La"
flowise_username = "riflowise_admin"
flowise_password = "P@ssword12345"
flowise_secretkey_overwrite = "GPDS040Q0MG76NQ8CVT99K21S"
webapp_ip_rules = [
  {
    name = "AllowedIP"
    ip_address = "X.X.X.X/32"
    headers = null
    virtual_network_subnet_id = null
    subnet_id = null
    service_tag = null
    priority = 300
    action = "Allow"
  }
]
postgres_ip_rules = {
  "ValbyOfficeIP" = "X.X.X.X"
  // Add more key-value pairs as needed
}
source_image = "flowiseai/flowise:latest"
tagged_image = "flow:v1"