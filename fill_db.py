import json
from database import SessionLocal, Product, Base, engine

# таблицы
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Читаем JSON 
with open('../products.json', 'r', encoding='utf-8') as f:
    products_data = json.load(f)

# Записываем в базу
for item in products_data:
    new_product = Product(
        name=item['name'],
        price=item['price'],
        brand=item['brand'],
        model=item['model'],
        year=item['year'],
        img=item['img']
    )
    db.add(new_product)

db.commit()
db.close()
print("База данных успешно заполнена товарами из JSON!")