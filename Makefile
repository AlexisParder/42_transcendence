-include .env
export

export HOST_IP := $(shell ip route get 1.1.1.1 | awk '{print $$7; exit}')

all: up

up:
	docker compose -f docker-compose.yml up --build

detach:
	docker compose -f docker-compose.yml up --build -d

down: 
	docker compose -f docker-compose.yml down

dev:
	docker compose -f docker-compose.dev.yml up --build

dev_down: 
	docker compose -f docker-compose.dev.yml down

logs:
	docker compose logs -f

migrate:
	docker compose -f docker-compose.dev.yml exec backend pnpm prisma migrate dev --name $(name)

studio:
	@cd backend && pnpm prisma studio --url="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"

clean: down dev_down

fclean:
	docker compose -f docker-compose.yml down -v
	docker compose -f docker-compose.dev.yml down -v

re: fclean all

.PHONY: all up detach down dev dev_down logs migrate studio clean fclean re