import sys
import os

# Add backend to path
sys.path.insert(0, '/opt/data/home/ahsaipos/backend')

from app.core.database import SessionLocal
from app.models.entities import Owner, Store, Category, Product, ProductVariant, ProductSerial, RestaurantTable

def main():
    db = SessionLocal()
    owner = db.query(Owner).filter(Owner.email == 'ahsai001@gmail.com').first()
    if not owner:
        print("Owner not found")
        return

    print(f"Populating sample data for owner: {owner.name} (ID: {owner.id})")

    # 1. TOKO 1: RITEL APPAREL & RIDING GEAR (Toko Kakak)
    toko_apparel = db.query(Store).filter(Store.owner_id == owner.id, Store.business_type == 'retail').first()
    if not toko_apparel:
        toko_apparel = Store(
            owner_id=owner.id,
            name="Ahsai MotoGear & Apparel",
            business_type="retail",
            phone="081234567890",
            address="Jl. Raya Otomotif No. 88, Jakarta",
            receipt_footer="Safety First! Barang yang sudah dibeli dapat ditukar ukuran max 3 hari."
        )
        db.add(toko_apparel)
        db.commit()
        db.refresh(toko_apparel)
    else:
        toko_apparel.name = "Ahsai MotoGear & Apparel"
        toko_apparel.address = "Jl. Raya Otomotif No. 88, Jakarta"
        db.commit()

    # Categories Apparel
    cat_jaket = Category(store_id=toko_apparel.id, name="Jaket Riding")
    cat_sepatu = Category(store_id=toko_apparel.id, name="Sepatu Touring")
    cat_glove = Category(store_id=toko_apparel.id, name="Sarung Tangan")
    cat_helm = Category(store_id=toko_apparel.id, name="Helm & Aksesoris")
    db.add_all([cat_jaket, cat_sepatu, cat_glove, cat_helm])
    db.commit()

    # Products Apparel
    p_jaket = Product(
        store_id=toko_apparel.id, category_id=cat_jaket.id,
        name="Jaket Riding Windproof Touring Pro",
        sku="JKT-WND-01", barcode="899100101",
        cost_price=280000, selling_price=395000, stock=25,
        has_variants=True
    )
    p_sepatu = Product(
        store_id=toko_apparel.id, category_id=cat_sepatu.id,
        name="Sepatu Boots Biker Waterproof 40-44",
        sku="SPT-BKR-02", barcode="899100102",
        cost_price=350000, selling_price=480000, stock=18,
        has_variants=True
    )
    p_glove = Product(
        store_id=toko_apparel.id, category_id=cat_glove.id,
        name="Sarung Tangan Kulit Protector Carbon",
        sku="GLV-CRB-03", barcode="899100103",
        cost_price=85000, selling_price=135000, stock=30,
        has_variants=True
    )
    p_balaclava = Product(
        store_id=toko_apparel.id, category_id=cat_helm.id,
        name="Balaclava Masker Spandex Coolmax",
        sku="BLC-CLM-04", barcode="899100104",
        cost_price=20000, selling_price=35000, stock=50,
        has_variants=False
    )
    db.add_all([p_jaket, p_sepatu, p_glove, p_balaclava])
    db.commit()
    db.refresh(p_jaket)
    db.refresh(p_sepatu)

    # Variants for Jaket & Sepatu
    v_jaket_m = ProductVariant(product_id=p_jaket.id, name="Size M - Hitam", sku="JKT-WND-01-M-BLK", cost_price=280000, selling_price=395000, stock=8)
    v_jaket_l = ProductVariant(product_id=p_jaket.id, name="Size L - Hitam", sku="JKT-WND-01-L-BLK", cost_price=280000, selling_price=395000, stock=10)
    v_jaket_xl = ProductVariant(product_id=p_jaket.id, name="Size XL - Abu Merah", sku="JKT-WND-01-XL-RED", cost_price=280000, selling_price=395000, stock=7)

    v_sepatu_41 = ProductVariant(product_id=p_sepatu.id, name="Ukuran 41 - Hitam", sku="SPT-BKR-02-41", cost_price=350000, selling_price=480000, stock=6)
    v_sepatu_42 = ProductVariant(product_id=p_sepatu.id, name="Ukuran 42 - Hitam", sku="SPT-BKR-02-42", cost_price=350000, selling_price=480000, stock=8)
    v_sepatu_43 = ProductVariant(product_id=p_sepatu.id, name="Ukuran 43 - Hitam", sku="SPT-BKR-02-43", cost_price=350000, selling_price=480000, stock=4)

    db.add_all([v_jaket_m, v_jaket_l, v_jaket_xl, v_sepatu_41, v_sepatu_42, v_sepatu_43])
    db.commit()


    # 2. TOKO 2: ELEKTRONIK, KOMPUTER & CCTV (Toko Adik)
    toko_cctv = Store(
        owner_id=owner.id,
        name="Ahsai Komputer & Solusi CCTV",
        business_type="electronics",
        phone="081398765432",
        address="Harco Glodok Blok B No. 12, Jakarta",
        receipt_footer="Garansi resmi toko & distributor. Simpan nota & segel garansi tidak boleh rusak."
    )
    db.add(toko_cctv)
    db.commit()
    db.refresh(toko_cctv)

    # Categories Electronics
    cat_cctv = Category(store_id=toko_cctv.id, name="Paket & Kamera CCTV")
    cat_komputer = Category(store_id=toko_cctv.id, name="Hardware & Komponen PC")
    cat_jasa = Category(store_id=toko_cctv.id, name="Jasa Pemasangan & Servis")
    db.add_all([cat_cctv, cat_komputer, cat_jasa])
    db.commit()

    # Products Electronics
    p_dvr = Product(
        store_id=toko_cctv.id, category_id=cat_cctv.id,
        name="DVR CCTV 4 Channel Full HD 1080P",
        sku="DVR-4CH-1080", barcode="899200201",
        cost_price=350000, selling_price=475000, stock=8,
        has_serial_number=True
    )
    p_kamera = Product(
        store_id=toko_cctv.id, category_id=cat_cctv.id,
        name="Kamera CCTV Outdoor 2MP Night Vision ColorVu",
        sku="CAM-OUT-2MP", barcode="899200202",
        cost_price=160000, selling_price=225000, stock=20,
        has_serial_number=True
    )
    p_ssd = Product(
        store_id=toko_cctv.id, category_id=cat_komputer.id,
        name="SSD NVMe M.2 512GB PCIe Gen4",
        sku="SSD-512-NVME", barcode="899200203",
        cost_price=420000, selling_price=530000, stock=15,
        has_serial_number=True
    )
    p_pasang = Product(
        store_id=toko_cctv.id, category_id=cat_jasa.id,
        name="Jasa Pasang & Setting CCTV per Titik",
        sku="SRV-INST-01", barcode="899200204",
        cost_price=0, selling_price=75000, stock=999,
        track_stock=False
    )
    db.add_all([p_dvr, p_kamera, p_ssd, p_pasang])
    db.commit()
    db.refresh(p_dvr)
    db.refresh(p_ssd)

    # Serials for DVR & SSD
    s_dvr1 = ProductSerial(product_id=p_dvr.id, serial_number="DVR2026-001289", warranty_months=12)
    s_dvr2 = ProductSerial(product_id=p_dvr.id, serial_number="DVR2026-001290", warranty_months=12)
    s_ssd1 = ProductSerial(product_id=p_ssd.id, serial_number="NVME-SN882910", warranty_months=36)
    s_ssd2 = ProductSerial(product_id=p_ssd.id, serial_number="NVME-SN882911", warranty_months=36)
    db.add_all([s_dvr1, s_dvr2, s_ssd1, s_ssd2])
    db.commit()


    # 3. TOKO 3: RUMAH MAKAN / F&B (Resto Kuliner)
    toko_resto = Store(
        owner_id=owner.id,
        name="Dapur Nusantara Resto & Cafe",
        business_type="fnb",
        phone="082188776655",
        address="Jl. Kuliner Enak No. 15, Jakarta",
        receipt_footer="Selamat menikmati hidangan kami. Kritik & saran hubungi 082188776655."
    )
    db.add(toko_resto)
    db.commit()
    db.refresh(toko_resto)

    # Meja Restaurant (Tables)
    tables = [
        RestaurantTable(store_id=toko_resto.id, table_number="Meja 01", capacity=2),
        RestaurantTable(store_id=toko_resto.id, table_number="Meja 02", capacity=4),
        RestaurantTable(store_id=toko_resto.id, table_number="Meja 03", capacity=4),
        RestaurantTable(store_id=toko_resto.id, table_number="Meja 04", capacity=6),
        RestaurantTable(store_id=toko_resto.id, table_number="VIP Room", capacity=10),
    ]
    db.add_all(tables)
    db.commit()

    # Categories FnB
    cat_makanan = Category(store_id=toko_resto.id, name="Makanan Utama")
    cat_minuman = Category(store_id=toko_resto.id, name="Minuman Segar")
    cat_snack = Category(store_id=toko_resto.id, name="Camilan & Penutup")
    db.add_all([cat_makanan, cat_minuman, cat_snack])
    db.commit()

    # Products FnB
    menu_items = [
        Product(store_id=toko_resto.id, category_id=cat_makanan.id, name="Ayam Bakar Madu Spesial + Nasi", sku="FNB-AYM-01", cost_price=16000, selling_price=32000, stock=50, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_makanan.id, name="Nasi Goreng Kampung Telur Ceplok", sku="FNB-NAS-02", cost_price=12000, selling_price=25000, stock=60, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_makanan.id, name="Sop Iga Sapi Kuah Rempah", sku="FNB-IGA-03", cost_price=28000, selling_price=48000, stock=30, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_minuman.id, name="Es Teh Manis Melati", sku="FNB-TEH-01", cost_price=2000, selling_price=6000, stock=100, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_minuman.id, name="Kopi Susu Gula Aren Tubruk", sku="FNB-KOP-02", cost_price=6000, selling_price=18000, stock=80, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_minuman.id, name="Jus Alpukat Kocok Cokelat", sku="FNB-JUS-03", cost_price=7000, selling_price=16000, stock=40, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_snack.id, name="Pisang Goreng Keju Cokelat Crispy", sku="FNB-PSG-01", cost_price=8000, selling_price=18000, stock=40, track_stock=False),
        Product(store_id=toko_resto.id, category_id=cat_snack.id, name="Tahu Walik Banyuwangi Sambal Colok", sku="FNB-THU-02", cost_price=7000, selling_price=15000, stock=40, track_stock=False),
    ]
    db.add_all(menu_items)
    db.commit()

    print("SUCCESS: 3 SAMPLE STORES & PRODUCTS CREATED FOR ahsai001@gmail.com!")
    db.close()

if __name__ == '__main__':
    main()
