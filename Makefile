.PHONY: install backend frontend dev

install:
	cd back && pip install -r requirements.txt
	cd front && npm install

backend:
	cd back && python3 main.py

frontend:
	cd front && npm run dev

dev:
	cd back && python3 main.py &
	cd front && npm run dev 