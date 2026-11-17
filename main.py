from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from database import SessionLocal, engine, Base, User, Product

# Создаем таблицы в базе данных
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Разрешаем запросы с нашего фронтенда (чтобы не было ошибки CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Подключение к базе
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Схемы данных (Pydantic)
class UserCreate(BaseModel):
    email: str
    password: str

# ================= АВТОЗАПОЛНЕНИЕ БАЗЫ ПРИ СТАРТЕ =================
def init_db():
    db = SessionLocal()
    # Проверяем, пустая ли база
    if db.query(Product).count() == 0:
        # Данные товаров прямо в коде
        products_data = [
            {"name": "Накладки на сиденья", "price": 2490, "brand": "toyota", "model": "camry", "year": "2020", "img": "images/seat.png"},
            {"name": "Оплетка на руль", "price": 1290, "brand": "bmw", "model": "x5", "year": "2015", "img": "images/wheel.png"},
            {"name": "Держатель для телефона", "price": 1790, "brand": "mercedes", "model": "e-class", "year": "2020", "img": "images/holder.png"},
            {"name": "LED-подсветка", "price": 990, "brand": "lada", "model": "camry", "year": "2010", "img": "images/led.png"},
            {"name": "Щетки стеклоочистителя", "price": 1490, "brand": "toyota", "model": "camry", "year": "2015", "img": "images/wipers.png"},
            {"name": "Органайзер в багажник", "price": 1990, "brand": "bmw", "model": "x5", "year": "2020", "img": "images/organizer.png"},
            {"name": "Солнцезащитный экран", "price": 890, "brand": "mercedes", "model": "e-class", "year": "2015", "img": "images/sunshade.png"},
            {"name": "Автомобильное ЗУ", "price": 890, "brand": "lada", "model": "x5", "year": "2010", "img": "images/charger.png"},
            {"name": "Видеорегистратор", "price": 3890, "brand": "toyota", "model": "camry", "year": "2020", "img": "images/dvr.png"},
            {"name": "Спойлер на крышу", "price": 3890, "brand": "bmw", "model": "x5", "year": "2020", "img": "images/spoiler.png"},
            {"name": "Коврики в салон", "price": 1890, "brand": "mercedes", "model": "e-class", "year": "2020", "img": "images/mats.png"},
            {"name": "Ароматизатор", "price": 1890, "brand": "lada", "model": "camry", "year": "2015", "img": "images/aroma.png"}
        ]
        
        for item in products_data:
            new_product = Product(
                name=item['name'], price=item['price'],
                brand=item['brand'], model=item['model'],
                year=item['year'], img=item['img']
            )
            db.add(new_product)
        
        db.commit()
        print("База данных успешно заполнена при старте!")
    db.close()

# Вызываем функцию заполнения при запуске сервера
init_db()

# ================= ОБРАБОТЧИКИ API =================

# 1. Список всех товаров
@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

# 2. Получение одного товара по ID
@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product

# 3. Регистрация пользователя
@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email уже занят")
    
    hashed_pw = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    return {"message": "Пользователь успешно зарегистрирован"}

# 4. Вход (логин)
@app.post("/api/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    return {"message": "Успешный вход", "user_id": db_user.id}

# Запуск сервера (для локальной проверки)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)