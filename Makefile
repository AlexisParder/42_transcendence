all: up

up:
	docker compose up --build

detach:
	docker compose up --build -d

down: 
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose exec backend pnpm prisma migrate dev --name $(name)

studio:
	docker compose exec backend pnpm prisma studio --browser none --port 5555

clean: down

fclean:
	docker compose down -v

re: fclean all

.PHONY: all up detach down logs migrate studio clean fclean re