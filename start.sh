mkdir -p ./logs
chmod 777 -R ./logs
chmod 777 -R ./media
docker-compose -f conifig/chrome-nodes up -d
docker-compose -f conifig/browser-nodes ps