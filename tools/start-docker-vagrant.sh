cd /vagrant && sudo docker run --name app -v /vagrant:/opt/src -p 8080:8080 -d plwconsulting/assets-to-pdf && echo '  node docker running...'