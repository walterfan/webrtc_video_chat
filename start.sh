mkdir -p ./logs
chmod 777 -R ./logs
chmod 777 -R ./media
docker-compose -f conifig/browser-nodes.yml up -d
docker-compose -f conifig/browser-nodes.yml ps