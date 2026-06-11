import { CropSample, AgriculturalZone } from "./types";

export const SAMPLE_CROPS: CropSample[] = [
  {
    id: "tomato_blight",
    name: "Tomato Leaf Blight",
    localName: "टमाटर अगेती/पछेती झुलसा | టమోటా ఆకు మచ్చ తెగులు",
    crop: "Tomato",
    symptoms: "Concentric dark brown rings with yellow halo; bottom leaves rotting and spreading upwards.",
    imageUrl: "🍅",
    notes: "Appeared 3 days after heavy rainfall. Soil is highly damp.",
    sampleBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImWNkYPjP8P+fAUMAEMDAMAADEMgG/Ykof5cAAAAASUVORK5CYII=" // Light green-brown pixels
  },
  {
    id: "rice_blast",
    name: "Rice Leaf Blast",
    localName: "धान का झोंका रोग | వరి అగ్గి తెగులు",
    crop: "Rice / Paddy",
    symptoms: "Spindle-shaped lesions with grayish centers and brown borders on paddy leaf blade.",
    imageUrl: "🌾",
    notes: "Spread across 5 acres. Sown early June under humid overcast conditions.",
    sampleBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImWNk+M/w/+f/PwMIMALMADDEB/1M/5cAAAAASUVORK5CYII=" // Spindled-yellow pixels
  },
  {
    id: "cotton_curl",
    name: "Cotton Leaf Curl Virus",
    localName: "कपास पत्ता मरोड़ रोग | పత్తి ఆకు ముడత తెగులు",
    crop: "Cotton",
    symptoms: "Leaves curling upwards with thickened veins. Tiny white insects visible under the leaves.",
    imageUrl: "☁️",
    notes: "Whitefly populations are very active. Soil moisture is standard dry.",
    sampleBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImWO0sfH5/+/fPwMIMALMADDICf0Q3hXUAAAAAElFTkSuQmCC" // Powdery whitefly style yellow-green pixels
  },
  {
    id: "healthy_wheat",
    name: "Healthy Leaf Specimen",
    localName: "स्वस्थ गेहूं की पत्ती | ఆరోగ్యకరమైన గోధుమ ఆకు",
    crop: "Wheat",
    symptoms: "Lush green pigment, straight venation, no visible lesions, insect damage or necrosis.",
    imageUrl: "🌱",
    notes: "Checking if AI successfully detects healthy crop status. Moist-aerated fertile soil.",
    sampleBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" // Solid green
  }
];

export const AGRICULTURAL_ZONES: AgriculturalZone[] = [
  {
      "state": "Andhra Pradesh",
      "district": "Anantapur",
      "regionName": "Rayalaseema Zone",
      "soilType": "Red Sandy & Loamy Soils",
      "primaryCrops": [
          "Groundnut",
          "Sunflower",
          "Paddy",
          "Sweet Lime",
          "Pomegranate"
      ],
      "climate": "Dry Semi-Arid, Low Annual Rainfall (~540mm)",
      "currentSeasonTemp": "33-35°C",
      "humidity": "42%",
      "precipitationChance": "15%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Guntur",
      "regionName": "Krishna Deltaic and Coastal Plains",
      "soilType": "Deep Black Clayey & Alluvial Soil",
      "primaryCrops": [
          "Teja Red Chilli",
          "Tobacco",
          "Cotton",
          "Turmeric",
          "Paddy"
      ],
      "climate": "Tropical Sub-Humid Monsoon",
      "currentSeasonTemp": "35°C",
      "humidity": "62%",
      "precipitationChance": "30%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Kurnool",
      "regionName": "Scarce Rainfall Zone",
      "soilType": "Black Cotton & Mixed Red Gravelly soils",
      "primaryCrops": [
          "Paddy (Kurnool Sona)",
          "Onion",
          "Bengal Gram",
          "Groundnut",
          "Cotton"
      ],
      "climate": "Dry Semi-Arid, Low Precipitation",
      "currentSeasonTemp": "34°C",
      "humidity": "40%",
      "precipitationChance": "10%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "East Godavari",
      "regionName": "Godavari Deltaic Zone",
      "soilType": "Fertile Deltaic Alluvial Silt",
      "primaryCrops": [
          "Paddy",
          "Coconut",
          "Banana",
          "Cashew",
          "Tapioca"
      ],
      "climate": "Humid Coastal Maritime",
      "currentSeasonTemp": "32°C",
      "humidity": "78%",
      "precipitationChance": "55%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "West Godavari",
      "regionName": "Godavari Alluvial Plains",
      "soilType": "Alluvial Clay & Sandy clay loam",
      "primaryCrops": [
          "Paddy",
          "Sugarcane",
          "Lemon (Acid Lime)",
          "Oil Palm",
          "Maize"
      ],
      "climate": "Warm Coastal Humid",
      "currentSeasonTemp": "33°C",
      "humidity": "75%",
      "precipitationChance": "50%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Chittoor",
      "regionName": "Southern Zone of Rayalaseema",
      "soilType": "Red Sandy Clayey Soils",
      "primaryCrops": [
          "Tomato (Madanapalle)",
          "Mango",
          "Groundnut",
          "Sugarcane",
          "Milk Diary"
      ],
      "climate": "Semi-Arid Dry-Mild Plateau",
      "currentSeasonTemp": "31°C",
      "humidity": "55%",
      "precipitationChance": "25%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Nellore",
      "regionName": "South Coastal Zone",
      "soilType": "Sandy Alluvium & Coastal Saline Soil",
      "primaryCrops": [
          "Paddy",
          "Lemon",
          "Black Gram",
          "Groundnut",
          "Aquaculture Feed"
      ],
      "climate": "Hot Coastal Maritime Dry-Summer",
      "currentSeasonTemp": "33°C",
      "humidity": "70%",
      "precipitationChance": "40%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Kadapa",
      "regionName": "Rayalaseema Dry Hill Belt",
      "soilType": "Red Loam, Black Clay & Limestone Soils",
      "primaryCrops": [
          "Turmeric",
          "Sweet Lime",
          "Banana",
          "Groundnut",
          "Paddy"
      ],
      "climate": "Semi-Arid Hot & Dry",
      "currentSeasonTemp": "34°C",
      "humidity": "45%",
      "precipitationChance": "15%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Visakhapatnam",
      "regionName": "North Coastal Hilly Belt",
      "soilType": "Red Sandy Loam & Laterite Hills",
      "primaryCrops": [
          "Paddy",
          "Sugarcane",
          "Araku Valley Coffee",
          "Finger Millet (Ragi)",
          "Cashew"
      ],
      "climate": "Tropical Coastal Forest Hilly",
      "currentSeasonTemp": "30°C",
      "humidity": "80%",
      "precipitationChance": "60%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Srikakulam",
      "regionName": "North Coastal Zone",
      "soilType": "Red Sandy Loams & River Alluvial Silt",
      "primaryCrops": [
          "Paddy",
          "Cashew",
          "Coconut",
          "Groundnut",
          "Sesame"
      ],
      "climate": "Sub-tropical Coastal Humid",
      "currentSeasonTemp": "31°C",
      "humidity": "78%",
      "precipitationChance": "45%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Vizianagaram",
      "regionName": "North Coastal Plain Zone",
      "soilType": "Red Sandy Loams & Laterite-Alluvial soils",
      "primaryCrops": [
          "Paddy",
          "Maize",
          "Groundnut",
          "Mesta",
          "Sugarcane"
      ],
      "climate": "Tropical Sub-Humid Maritime",
      "currentSeasonTemp": "31°C",
      "humidity": "76%",
      "precipitationChance": "40%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Krishna",
      "regionName": "Krishna Deltaic Plains Zone",
      "soilType": "Heavy Clayey Coastal Alluvium",
      "primaryCrops": [
          "Paddy",
          "Black Gram",
          "Mango",
          "Sugarcane",
          "Guava"
      ],
      "climate": "Tropical Monsoonal Humid",
      "currentSeasonTemp": "34°C",
      "humidity": "70%",
      "precipitationChance": "45%"
  },
  {
      "state": "Andhra Pradesh",
      "district": "Prakasam",
      "regionName": "South Coastal Dry-Plain Zone",
      "soilType": "Red Gravelly Sandy & Deep Black Soils",
      "primaryCrops": [
          "Tobacco",
          "Paddy",
          "Cotton",
          "Bengal Gram",
          "Chilli"
      ],
      "climate": "Semi-Arid Dry Hot Tropical",
      "currentSeasonTemp": "34°C",
      "humidity": "58%",
      "precipitationChance": "25%"
  },
  {
      "state": "Maharashtra",
      "district": "Nagpur",
      "regionName": "Vidarbha Plain Zone",
      "soilType": "Black Cotton (Regur) Soil",
      "primaryCrops": [
          "Cotton",
          "Soybean",
          "Sweet Oranges",
          "Pigeon Pea",
          "Paddy"
      ],
      "climate": "Tropical Humid & Dry Climate",
      "currentSeasonTemp": "31°C",
      "humidity": "65%",
      "precipitationChance": "40%"
  },
  {
      "state": "Punjab",
      "district": "Bhatinda",
      "regionName": "Malwa Agricultural Belt",
      "soilType": "Sandy Alluvial Loam",
      "primaryCrops": [
          "Wheat",
          "Paddy",
          "American Cotton",
          "Mustard",
          "Potato"
      ],
      "climate": "Hot Dry Continent-Continental Border",
      "currentSeasonTemp": "28°C",
      "humidity": "50%",
      "precipitationChance": "25%"
  },
  {
      "state": "Karnataka",
      "district": "Chikkaballapur",
      "regionName": "Eastern Dry Zone",
      "soilType": "Red Clayey & Gravelly Soils",
      "primaryCrops": [
          "Tomato",
          "Maize",
          "Ragi",
          "Mulberry (Silkworm)",
          "Pomegranate"
      ],
      "climate": "Semi-Arid Dry-Mild Plain",
      "currentSeasonTemp": "29°C",
      "humidity": "58%",
      "precipitationChance": "35%"
  },
  {
      "state": "Uttar Pradesh",
      "district": "Lucknow",
      "regionName": "Central Gangetic Plains",
      "soilType": "Deep Alluvial Loam",
      "primaryCrops": [
          "Sugarcane",
          "Wheat",
          "Paddy",
          "Potato",
          "Mango",
          "Mustard"
      ],
      "climate": "Sub-humid Subtropical Wet Monsoon",
      "currentSeasonTemp": "32°C",
      "humidity": "70%",
      "precipitationChance": "60%"
  },
  {
      "state": "Gujarat",
      "district": "Anand",
      "regionName": "Middle Gujarat Plain Zone",
      "soilType": "Goradu Silty Sandy Loam",
      "primaryCrops": [
          "Tobacco",
          "Groundnut",
          "American Cotton",
          "Castor Seed",
          "Rice",
          "Banana"
      ],
      "climate": "Semi-Arid Dry Subtropical Coast",
      "currentSeasonTemp": "34°C",
      "humidity": "45%",
      "precipitationChance": "10%"
  },
  {
      "state": "West Bengal",
      "district": "Burdwan",
      "regionName": "New Alluvial Damodar Basin",
      "soilType": "Fertile Silty Clay Alluvium",
      "primaryCrops": [
          "Kharif Paddy",
          "Boro Rice",
          "Raw Jute",
          "Potato",
          "Mustard Seed",
          "Sesame"
      ],
      "climate": "Tropical Humid Swampy Delta",
      "currentSeasonTemp": "30°C",
      "humidity": "82%",
      "precipitationChance": "70%"
  },
  {
      "state": "Assam",
      "district": "Jorhat",
      "regionName": "Upper Brahmaputra Valley",
      "soilType": "Acidic River Alluvial Silt",
      "primaryCrops": [
          "Ortodox Tea",
          "Summer Paddy",
          "Yellow Mustard",
          "Assam Lemon",
          "Bamboos",
          "Ginger"
      ],
      "climate": "Hyper-Humid Rain forest Subtropical Plain",
      "currentSeasonTemp": "27°C",
      "humidity": "88%",
      "precipitationChance": "80%"
  },
  {
      "state": "Madhya Pradesh",
      "district": "Indore",
      "regionName": "Malwa Plateau Zone",
      "soilType": "Medium-Deep Clayey Black soil",
      "primaryCrops": [
          "Yellow Soybean",
          "Malwi Durum Wheat",
          "Kabuli Chana",
          "Maize",
          "Garlic",
          "Onion"
      ],
      "climate": "Subtropical Semi-Arid Hilly Tableland",
      "currentSeasonTemp": "32°C",
      "humidity": "52%",
      "precipitationChance": "20%"
  },
  {
      "state": "Tamil Nadu",
      "district": "Thanjavur",
      "regionName": "Cauvery Deltaic Basin Zone",
      "soilType": "Heavy Deep Deltaic Alluvium Silt",
      "primaryCrops": [
          "Samba Paddy",
          "Kuruvai Rice",
          "Coconut",
          "Dwarf Banana",
          "Black Gram",
          "Sugarcane"
      ],
      "climate": "Tropical Coastal Maritime Humid",
      "currentSeasonTemp": "33°C",
      "humidity": "72%",
      "precipitationChance": "45%"
  },
  {
      "state": "Rajasthan",
      "district": "Jodhpur",
      "regionName": "Arid Desert Western Plains",
      "soilType": "Thar Desert Coarse Sandy Soil",
      "primaryCrops": [
          "Pearl Millet (Bajra)",
          "Guar (Cluster Bean)",
          "Cumin Seed",
          "Moth Bean",
          "Mustard",
          "Ber"
      ],
      "climate": "Extremely Arid Desert Hot Air",
      "currentSeasonTemp": "38°C",
      "humidity": "28%",
      "precipitationChance": "5%"
  },
  {
      "state": "Himachal Pradesh",
      "district": "Shimla",
      "regionName": "Sub-Temperate Himalayan High Hills",
      "soilType": "Organic-Rich Moist Forest Humus",
      "primaryCrops": [
          "Royal Apple Orchards",
          "Off-season Peas",
          "Himachal Potato",
          "Seed Tomato",
          "Plum",
          "Cabbage"
      ],
      "climate": "Temperate Cool Wet Alpine Forest",
      "currentSeasonTemp": "19°C",
      "humidity": "60%",
      "precipitationChance": "50%"
  },
  {
      "state": "Telangana",
      "district": "Warangal",
      "regionName": "Telangana Central Plains Zone",
      "soilType": "Red Chalky Dubba Soils",
      "primaryCrops": [
          "Paddy",
          "Medium-Staple Cotton",
          "Teja Guntur Chilli",
          "Hybrid Maize",
          "Turmeric Rhizomes"
      ],
      "climate": "Semi-Arid Dry Tropical Savannah",
      "currentSeasonTemp": "34°C",
      "humidity": "48%",
      "precipitationChance": "30%"
  },
  {
      "state": "Telangana",
      "district": "Nizamabad",
      "regionName": "Northern Telangana Agro-climatic Zone",
      "soilType": "Deep Medium-Black Forest Soils",
      "primaryCrops": [
          "Turmeric",
          "Paddy",
          "Sugarcane",
          "Maize",
          "Soybean"
      ],
      "climate": "Semi-Arid Dry Tropical Sub-humid",
      "currentSeasonTemp": "34°C",
      "humidity": "50%",
      "precipitationChance": "30%"
  },
  {
      "state": "Telangana",
      "district": "Adilabad",
      "regionName": "Northern Highland zone",
      "soilType": "Deep Black Cotton (Regur) Soils",
      "primaryCrops": [
          "Cotton",
          "Soybean",
          "Red Gram",
          "Paddy",
          "Maize"
      ],
      "climate": "Tropical Continental Savannah",
      "currentSeasonTemp": "35°C",
      "humidity": "45%",
      "precipitationChance": "25%"
  },
  {
      "state": "Telangana",
      "district": "Karimnagar",
      "regionName": "Northeastern Plain of Telangana",
      "soilType": "Mixed Red Chalka & Deep Black Soils",
      "primaryCrops": [
          "Paddy",
          "Maize",
          "Cotton",
          "Turmeric",
          "Sesame"
      ],
      "climate": "Semi-Arid Savannah, Warm climate",
      "currentSeasonTemp": "34°C",
      "humidity": "52%",
      "precipitationChance": "30%"
  },
  {
      "state": "Telangana",
      "district": "Mahabubnagar",
      "regionName": "Southern Telangana Zone",
      "soilType": "Red Sandy Loams & Dubba Sands",
      "primaryCrops": [
          "Groundnut",
          "Cotton",
          "Castor Seed",
          "Pigeon Pea",
          "Ragi"
      ],
      "climate": "Dry Semi-Arid Drought-Prone Zone",
      "currentSeasonTemp": "35°C",
      "humidity": "42%",
      "precipitationChance": "15%"
  },
  {
      "state": "Telangana",
      "district": "Nalgonda",
      "regionName": "Southern Telangana Dry-Plain Zone",
      "soilType": "Red Sandy Chalky & Limestone Soils",
      "primaryCrops": [
          "Mosambi",
          "Paddy",
          "Cotton",
          "Groundnut",
          "Green Gram"
      ],
      "climate": "Hot Dry Semi-Arid Savannah",
      "currentSeasonTemp": "35°C",
      "humidity": "44%",
      "precipitationChance": "15%"
  },
  {
      "state": "Telangana",
      "district": "Khammam",
      "regionName": "Eastern Forest and River Basin Zone",
      "soilType": "Fertile Alluvial Clay & Sandy Loams",
      "primaryCrops": [
          "Teja Red Chilli",
          "Paddy",
          "Maize",
          "Mango",
          "Cotton"
      ],
      "climate": "Humid & Tropical Savannah Monsoon",
      "currentSeasonTemp": "33°C",
      "humidity": "60%",
      "precipitationChance": "35%"
  },
  {
      "state": "Telangana",
      "district": "Medak",
      "regionName": "Central Plateau of Telangana",
      "soilType": "Red Gravelly soils and Medium Black clays",
      "primaryCrops": [
          "Maize",
          "Paddy",
          "Sugarcane",
          "Cotton",
          "Sunflower"
      ],
      "climate": "Semi-Arid mild Savannah",
      "currentSeasonTemp": "33°C",
      "humidity": "53%",
      "precipitationChance": "25%"
  },
  {
      "state": "Telangana",
      "district": "Rangareddy",
      "regionName": "Peri-Urban Horticultural Belt",
      "soilType": "Red Chalky Dubba Soils & Gravelly Loams",
      "primaryCrops": [
          "Horticulture Vegetables",
          "Flowers / Rose",
          "Sorghum (Jowar)",
          "Maize",
          "Pigeon Pea"
      ],
      "climate": "Semi-Arid dry plateau",
      "currentSeasonTemp": "32°C",
      "humidity": "55%",
      "precipitationChance": "25%"
  },
  {
      "state": "Telangana",
      "district": "Suryapet",
      "regionName": "Krishna Irrigation Basin plains",
      "soilType": "Deep Black Clays & Red Chalky Soils",
      "primaryCrops": [
          "Paddy",
          "Teja Guntur Chilli",
          "Cotton",
          "Green Gram",
          "Groundnut"
      ],
      "climate": "Hot Semi-Arid, Summer Heavy Dryness",
      "currentSeasonTemp": "36°C",
      "humidity": "45%",
      "precipitationChance": "10%"
  },
  {
      "state": "Telangana",
      "district": "Siddipet",
      "regionName": "Central Telangana agro-belt",
      "soilType": "Mixed Chalka Dubba & Silt Loams",
      "primaryCrops": [
          "Paddy",
          "Cotton",
          "Maize",
          "Oil Palm",
          "Millets"
      ],
      "climate": "Mild dry savannah",
      "currentSeasonTemp": "32°C",
      "humidity": "52%",
      "precipitationChance": "20%"
  },
  {
      "state": "Telangana",
      "district": "Sangareddy",
      "regionName": "Western High Plateau Dry-Plains",
      "soilType": "Red Silt Clay, Heavy Black soils & Laterites",
      "primaryCrops": [
          "Sugarcane",
          "Ginger",
          "Pigeon Pea",
          "Cotton",
          "Paddy"
      ],
      "climate": "Semi-Arid Dry Tropical Savannah",
      "currentSeasonTemp": "33°C",
      "humidity": "48%",
      "precipitationChance": "25%"
  }
];
