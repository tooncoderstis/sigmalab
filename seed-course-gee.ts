import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "geospatial-remote-sensing" },
    update: {},
    create: {
      name: "Geospatial & Remote Sensing",
      slug: "geospatial-remote-sensing",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "gee-sentinel2-timeseries-ndvi" },
    update: {},
    create: {
      title: "Google Earth Engine: Time Series NDVI & Index Sentinel-2",
      slug: "gee-sentinel2-timeseries-ndvi",
      description:
        "Belajar dari nol menggunakan Google Earth Engine untuk mengekstrak time series NDVI, NDWI, EVI dan index lain dari citra Sentinel-2, dari data paling lawas sampai terbaru.",
      level: "MENENGAH",
      isPremium: false,
      price: 0,
      isPublished: true,
      categoryId: category.id,
    },
  });

  const modulesData = [
    {
      title: "Bagian 1 — Dasar Google Earth Engine",
      lessons: [
        {
          title: "1.1 Akses Google Earth Engine",
          body:
            "Daftar/aktivasi akun di **code.earthengine.google.com** menggunakan akun Google. Perlu approval non-commercial/commercial use case, biasanya instan untuk riset/edukasi.\n\nSetelah itu buka **Code Editor** di alamat yang sama — ini adalah IDE berbasis JavaScript di browser tempat semua script GEE ditulis.",
        },
        {
          title: "1.2 Konsep Dasar Objek EE",
          body:
            "Lima objek inti Earth Engine yang wajib dipahami:\n\n- `ee.Image` — satu citra (single scene / band-band raster)\n- `ee.ImageCollection` — kumpulan citra, misal seluruh arsip Sentinel-2\n- `ee.Geometry` — titik/polygon/area (AOI)\n- `ee.Feature` / `ee.FeatureCollection` — geometry plus atribut, misal shapefile batas wilayah\n- `ee.Reducer` — fungsi agregasi (mean, median, sum) untuk mereduksi piksel jadi satu nilai per area",
        },
        {
          title: "1.3 Menentukan Area of Interest (AOI)",
          body:
            "AOI bisa berupa titik, kotak, atau polygon dari asset yang sudah diupload.\n\nContoh titik:\n\n```javascript\nvar aoi = ee.Geometry.Point([102.2607, -3.7928]);\n```\n\nAtau pakai polygon dari asset:\n\n```javascript\nvar aoi = ee.FeatureCollection('projects/ragproject-480803/assets/Batas_Wilayah_KelurahanDesa_10K_AR')\n  .filter(ee.Filter.eq('NAMOBJ', 'NAMA_DESA_KAMU'))\n  .geometry();\n\nMap.centerObject(aoi, 12);\nMap.addLayer(aoi, {color: 'red'}, 'AOI');\n```",
        },
      ],
    },
    {
      title: "Bagian 2 — Load Data Sentinel-2",
      lessons: [
        {
          title: "2.1 Memilih Collection",
          body:
            "Gunakan Sentinel-2 Surface Reflectance Harmonized (data terkoreksi atmosfer, direkomendasikan untuk index vegetasi/air):\n\n```javascript\nvar s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');\n```\n\nKetersediaan data mulai **Maret 2017** untuk SR harmonized. Kalau butuh data dari 2015, harus pakai TOA `COPERNICUS/S2_HARMONIZED`, tapi belum terkoreksi atmosfer.",
        },
        {
          title: "2.2 Filter Tanggal dan Area",
          body:
            "```javascript\nvar startDate = '2017-03-28'; // data S2 SR paling lawas\nvar endDate = ee.Date(Date.now()).format('YYYY-MM-dd'); // hari ini\n\nvar s2Filtered = s2.filterBounds(aoi).filterDate(startDate, endDate);\n\nprint('Jumlah citra tersedia:', s2Filtered.size());\n```",
        },
        {
          title: "2.3 Masking Awan",
          body:
            "Masking awan **wajib** dilakukan sebelum menghitung index, menggunakan band `QA60`:\n\n```javascript\nfunction maskS2clouds(image) {\n  var qa = image.select('QA60');\n  var cloudBitMask = 1 << 10;\n  var cirrusBitMask = 1 << 11;\n  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));\n  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);\n}\n\nvar s2Clean = s2Filtered.map(maskS2clouds);\n```\n\nCatatan: metode **s2cloudless** (dataset `COPERNICUS/S2_CLOUD_PROBABILITY`) lebih akurat untuk area tropis berawan seperti Indonesia.",
        },
      ],
    },
    {
      title: "Bagian 3 — Menghitung Index (NDVI, NDWI, EVI, dll)",
      lessons: [
        {
          title: "3.1 Fungsi Index",
          body:
            "Band Sentinel-2 yang relevan: `B2` (Blue), `B3` (Green), `B4` (Red), `B8` (NIR), `B11` (SWIR1), `B12` (SWIR2).\n\n```javascript\nfunction addIndices(image) {\n  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');\n  var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');\n  var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');\n  var savi = image.expression(\n    '((NIR - RED) / (NIR + RED + L)) * (1 + L)', {\n      NIR: image.select('B8'),\n      RED: image.select('B4'),\n      L: 0.5\n  }).rename('SAVI');\n  var evi = image.expression(\n    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {\n      NIR: image.select('B8'),\n      RED: image.select('B4'),\n      BLUE: image.select('B2')\n  }).rename('EVI');\n\n  return image.addBands([ndvi, ndwi, ndbi, savi, evi]);\n}\n\nvar s2Indexed = s2Clean.map(addIndices);\n```",
        },
      ],
    },
    {
      title: "Bagian 4 — Time Series: Band & Index",
      lessons: [
        {
          title: "4.1 Chart Time Series di Code Editor",
          body:
            "Cara tercepat melihat fluktuasi adalah dengan `ui.Chart.image.series`:\n\n```javascript\nvar chart = ui.Chart.image.series({\n  imageCollection: s2Indexed.select(['NDVI', 'NDWI', 'EVI']),\n  region: aoi,\n  reducer: ee.Reducer.mean(),\n  scale: 10,\n  xProperty: 'system:time_start'\n}).setOptions({title: 'Time Series NDVI/NDWI/EVI (2017 - sekarang)'});\n\nprint(chart);\n```\n\nChart ini mengikuti frekuensi asli data, yaitu setiap kali ada citra bersih yang melewati AOI. Revisit Sentinel-2 untuk satu titik adalah sekitar **5 hari** (gabungan S2A+S2B), tapi jumlah titik riil tergantung tutupan awan.",
        },
        {
          title: "4.2 Ekstrak Nilai ke FeatureCollection",
          body:
            "```javascript\nvar tsFeatures = s2Indexed.map(function(img) {\n  var stats = img.select(['B2','B3','B4','B8','NDVI','NDWI','NDBI','SAVI','EVI'])\n      .reduceRegion({\n        reducer: ee.Reducer.mean(),\n        geometry: aoi,\n        scale: 10,\n        maxPixels: 1e9,\n        bestEffort: true\n      });\n  return ee.Feature(null, stats)\n      .set('date', img.date().format('YYYY-MM-dd'))\n      .set('system:time_start', img.get('system:time_start'));\n});\n\nvar tsClean = ee.FeatureCollection(tsFeatures).filter(ee.Filter.notNull(['NDVI']));\n```",
        },
        {
          title: "4.3 Export ke CSV (Google Drive)",
          body:
            "```javascript\nExport.table.toDrive({\n  collection: tsClean,\n  description: 'TimeSeries_S2_NDVI_dkk',\n  folder: 'GEE_exports',\n  fileNamePrefix: 'timeseries_s2_ndvi_2017_now',\n  fileFormat: 'CSV'\n});\n```\n\nJalankan lewat tab **Tasks** di kanan atas Code Editor, klik **Run**. Hasil CSV bisa dibuka di Excel/Python untuk analisis lanjut.",
        },
      ],
    },
    {
      title: "Bagian 5 — Menangani Fluktuasi: Harian vs Bulanan",
      lessons: [
        {
          title: "5.1 dan 5.2 — AOI Kecil vs Agregat Bulanan",
          body:
            "Kalau AOI kecil (titik/desa), data keluar otomatis per tanggal akuisisi asli (umumnya tiap sekitar 5 hari bila cerah).\n\nKalau ingin agregat bulanan (mengisi gap akibat awan, tren lebih halus):\n\n```javascript\nvar months = ee.List.sequence(0, ee.Date(endDate).difference(ee.Date(startDate), 'month').round());\n\nvar monthlyNDVI = ee.ImageCollection.fromImages(\n  months.map(function(m) {\n    var start = ee.Date(startDate).advance(m, 'month');\n    var end = start.advance(1, 'month');\n    var monthlyImg = s2Indexed.filterDate(start, end).select('NDVI').mean();\n    return monthlyImg.set('system:time_start', start.millis())\n                      .set('month', start.format('YYYY-MM'));\n  })\n);\n```\n\nIni menghasilkan **satu nilai per bulan** (komposit rata-rata semua citra bersih dalam bulan tersebut), cocok untuk melihat tren musiman/panen tanpa terganggu gap awan harian.",
        },
        {
          title: "5.3 Aturan Praktis Pilih Resolusi Temporal",
          body:
            "- Deteksi kejadian cepat (banjir, panen mendadak): pakai time series asli per-tanggal.\n- Analisis tren musiman/tahunan pada AOI luas dan sering berawan: pakai komposit bulanan.\n- Publikasi/perbandingan tahun ke tahun: pakai komposit bulanan atau per-musim (dry/wet season).",
        },
      ],
    },
    {
      title: "Bagian 6 — Script Lengkap Siap Pakai",
      lessons: [
        {
          title: "6.1 Script Gabungan End-to-End",
          body:
            "Berikut script lengkap yang menggabungkan semua bagian sebelumnya, dari AOI, load data, cloud mask, index, chart, sampai export tabel:\n\n```javascript\n// ==== 1. AOI ====\nvar aoi = ee.Geometry.Point([102.2607, -3.7928]); // GANTI sesuai lokasi kamu\nMap.centerObject(aoi, 12);\n\n// ==== 2. Load & Filter ====\nvar startDate = '2017-03-28';\nvar endDate = ee.Date(Date.now()).format('YYYY-MM-dd');\nvar s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')\n  .filterBounds(aoi)\n  .filterDate(startDate, endDate);\n\n// ==== 3. Cloud Mask ====\nfunction maskS2clouds(image) {\n  var qa = image.select('QA60');\n  var cloudBitMask = 1 << 10;\n  var cirrusBitMask = 1 << 11;\n  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));\n  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);\n}\nvar s2Clean = s2.map(maskS2clouds);\n\n// ==== 4. Index ====\nfunction addIndices(image) {\n  var ndvi = image.normalizedDifference(['B8','B4']).rename('NDVI');\n  var ndwi = image.normalizedDifference(['B3','B8']).rename('NDWI');\n  var ndbi = image.normalizedDifference(['B11','B8']).rename('NDBI');\n  var evi  = image.expression('2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))',\n    {NIR: image.select('B8'), RED: image.select('B4'), BLUE: image.select('B2')}).rename('EVI');\n  return image.addBands([ndvi, ndwi, ndbi, evi]);\n}\nvar s2Indexed = s2Clean.map(addIndices);\n\n// ==== 5. Chart Time Series ====\nprint(ui.Chart.image.series({\n  imageCollection: s2Indexed.select(['NDVI','NDWI','EVI']),\n  region: aoi, reducer: ee.Reducer.mean(), scale: 10, xProperty: 'system:time_start'\n}).setOptions({title: 'Time Series Index Sentinel-2 (2017 - sekarang)'}));\n\n// ==== 6. Export Tabel ====\nvar tsFeatures = s2Indexed.map(function(img) {\n  var stats = img.select(['B2','B3','B4','B8','NDVI','NDWI','NDBI','EVI'])\n    .reduceRegion({reducer: ee.Reducer.mean(), geometry: aoi, scale: 10, bestEffort: true});\n  return ee.Feature(null, stats)\n    .set('date', img.date().format('YYYY-MM-dd'))\n    .set('system:time_start', img.get('system:time_start'));\n});\nvar tsClean = ee.FeatureCollection(tsFeatures).filter(ee.Filter.notNull(['NDVI']));\n\nExport.table.toDrive({\n  collection: tsClean,\n  description: 'TimeSeries_S2_Index',\n  fileNamePrefix: 'timeseries_s2_index',\n  fileFormat: 'CSV'\n});\n```\n\n**Cara pakai:** ganti koordinat AOI di baris pertama, paste seluruh script ke Code Editor, klik **Run**, lihat chart-nya langsung di panel Console, lalu jalankan task export di tab **Tasks** kalau mau file CSV.",
        },
      ],
    },
    {
      title: "Bagian 7 — Tips Lanjutan",
      lessons: [
        {
          title: "7.1 Tips dan Pengembangan Lanjutan",
          body:
            "- **Poligon (bukan titik):** ganti `aoi` dengan `ee.FeatureCollection(...).geometry()` seperti pada Bagian 1.3, cocok untuk analisis per desa/kelurahan dari asset batas wilayah yang sudah diupload.\n- **Gap akibat awan panjang:** setelah export CSV, interpolasi linear atau Savitzky-Golay bisa dilakukan di Python (`pandas`/`scipy`) untuk menghaluskan seri data.\n- **Lebih dari satu lokasi sekaligus:** gunakan `reduceRegions` (bukan `reduceRegion`) dengan `FeatureCollection` berisi banyak polygon/desa, sehingga satu export CSV berisi time series semua lokasi sekaligus.\n- **Python/geemap:** semua logika di atas juga bisa ditulis di Python via `earthengine-api` dan `geemap` kalau lebih nyaman di Jupyter/Colab, strukturnya sama persis, hanya sintaks yang berbeda.",
        },
      ],
    },
  ];

  // Hapus module (dan lesson di dalamnya, via cascade) yang lama milik course ini,
  // supaya script ini aman dijalankan berkali-kali tanpa kena unique constraint error.
  await prisma.module.deleteMany({ where: { courseId: course.id } });

  let order = 1;
  for (const mod of modulesData) {
    const createdModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: mod.title,
        order: order++,
      },
    });

    let lessonOrder = 1;
    for (const lesson of mod.lessons) {
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lesson.title,
          order: lessonOrder++,
          type: "ARTICLE",
          articleBody: lesson.body,
        },
      });
    }
  }

  console.log("Seed selesai. Course slug:", course.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
