/**
 * Pre-loaded Agricultural Knowledge Base
 * 
 * Comprehensive seed data covering all 8 agent domains so the RAG engine
 * provides contextual answers out of the box — no farmer upload required.
 */

export const SEED_KNOWLEDGE_BASE: { domain: string; entries: string[] }[] = [
    // ================================================================
    // AGRIDETECT — Crop Disease & Pest Knowledge
    // ================================================================
    {
        domain: "agri-detect",
        entries: [
            "Wheat Leaf Rust (Puccinia triticina): Orange-brown pustules on leaves. Spray Propiconazole 25% EC at 1ml/L or Tebuconazole 250 EC at 1ml/L. Best applied at first sign of pustules. Resistant varieties: HD-2967, PBW-550, WH-1105.",
            "Rice Blast (Magnaporthe oryzae): Diamond-shaped lesions on leaves turning grey with brown margins. Apply Tricyclazole 75% WP at 0.6g/L as preventive spray. Avoid excess nitrogen. Drain fields if severely affected. Resistant varieties: Pusa Basmati 1509, Samba Mahsuri.",
            "Tomato Late Blight (Phytophthora infestans): Water-soaked lesions on leaves turning brown-black. White mold underneath leaves in humid conditions. Spray Mancozeb 75% WP at 2.5g/L or Metalaxyl + Mancozeb at 2.5g/L. Remove infected plants immediately.",
            "Cotton Bollworm (Helicoverpa armigera): Larvae bore into bolls causing damage. Use pheromone traps for early detection. Spray Emamectin Benzoate 5% SG at 0.4g/L or Spinosad 45% SC at 0.3ml/L. Use Bt cotton varieties for built-in resistance.",
            "Mustard Aphid (Lipaphis erysimi): Green soft-bodied insects clustering on stems and pods. Causes yellowing and stunted growth. Spray Imidacloprid 17.8% SL at 0.3ml/L or Dimethoate 30% EC at 2ml/L. Neem oil 5ml/L as organic alternative.",
            "Powdery Mildew in Cucurbits: White powdery coating on leaves. Apply Sulphur 80% WP at 3g/L or Hexaconazole 5% EC at 2ml/L. Ensure good air circulation. Avoid overhead watering. Resistant varieties available for certain cucurbits.",
            "Bacterial Leaf Blight in Rice (Xanthomonas oryzae): Yellow to white lesions starting from leaf tips. No chemical cure effective. Use resistant varieties like Swarna, MTU-7029. Avoid excess nitrogen. Drain standing water. Apply Streptocycline 6g + Copper oxychloride 50g in 15L water as preventive.",
            "Fall Armyworm in Maize (Spodoptera frugiperda): Larvae feed on whorl leaves creating window panes and holes. Apply Chlorantraniliprole 18.5% SC at 0.4ml/L in whorl. Use pheromone traps for monitoring. Early planting reduces infestation. Release Trichogramma parasitoids as biocontrol.",
            "Fusarium Wilt in Chickpea: Yellowing and drooping of plants, vascular browning. No effective chemical control on infected plants. Use resistant varieties JG-62, Avrodhi. Seed treatment with Trichoderma viride at 4g/kg seed. Deep summer plowing reduces soil inoculum.",
            "Red Hairy Caterpillar in Groundnut: Hairy larvae feed on leaves causing defoliation. Collect and destroy egg masses. Apply Quinalphos 25% EC at 2ml/L. Light traps for adult moths. Intercropping with castor as trap crop."
        ]
    },

    // ================================================================
    // SEED SAGE — Seed & Variety Recommendations
    // ================================================================
    {
        domain: "seed-sage",
        entries: [
            "Wheat varieties for North India: HD-3226 (Pusa Yashasvi) — yield 55-60 q/ha, disease resistant, suitable for irrigated timely sown. PBW-725 — yield 50-55 q/ha, rust resistant, late sown suitable. WH-1270 — high protein content, suitable for sandy loam.",
            "Rice varieties for Eastern India: Swarna (MTU-7029) — yield 45-50 q/ha, medium duration 140 days, bacterial blight resistant. Sahbhagi Dhan — drought tolerant, 105 days, suitable for rainfed uplands. Rajendra Bhagwati — yield 55 q/ha, short duration.",
            "Maize hybrids for Kharif season: HQPM-1 — quality protein maize, yield 65-70 q/ha. DHM-117 — suitable for all India, yield 80 q/ha. Bio-9681 — excellent cob size, drought tolerant, yield 75 q/ha.",
            "Soybean varieties: JS-9560 — yield 25-30 q/ha, girdle beetle resistant, suitable for Madhya Pradesh. NRC-86 — early maturing 85 days, yield 22-25 q/ha. JS-2069 — high oil content 21%, yield 28 q/ha.",
            "Mustard varieties for Rajasthan: RH-749 — yield 22-25 q/ha, white rust resistant. Pusa Bold — bold seeded, yield 18-20 q/ha, suitable for sandy soils. RGN-229 — yield 20-22 q/ha, 130 days duration.",
            "Cotton varieties: Bt Cotton hybrids recommended — Bollgard II for bollworm protection. MRC-7351 — high yielding, suitable for all cotton zones. NCS-855 — compact plant, drought tolerant, yield 25-30 q/ha.",
            "Vegetable seeds for small farmers: Tomato Arka Vikas — open pollinated, yield 35-40 t/ha, heat tolerant. Brinjal Pusa Purple Long — resistant to shoot borer. Chilli Pusa Jwala — high pungency, 15-18 t/ha. Okra A-4 — Yellow Vein Mosaic resistant.",
            "Seed treatment recommendations: Treat wheat seeds with Carboxin 37.5% + Thiram 37.5% WP at 2.5g/kg for loose smut and bunt prevention. Rice seed treatment with Tricyclazole for blast prevention. Always dry seeds in shade after treatment before sowing.",
            "Pulses for rotation: Chickpea varieties JG-14, JAKI-9218 — yield 18-22 q/ha. Lentil IPL-316 — high yielding, wilt resistant. Pigeon pea UPAS-120 — extra early 120 days. Green gram Virat — yield 12-15 q/ha, MYMV resistant.",
            "Sandy soil seed recommendations: For sandy soils in Rajasthan and Gujarat — Pearl Millet HHB-67 Improved is highly recommended with yield 25-28 q/ha. Cluster Bean RGC-1066 performs excellently in sandy soil. Moth Bean RMO-435 is drought hardy. Guar (Cluster Bean) is highly profitable in sandy soils due to gum demand."
        ]
    },

    // ================================================================
    // MARKET ORACLE — Mandi Prices & Market Intelligence
    // ================================================================
    {
        domain: "market-oracle",
        entries: [
            "Wheat MSP 2025-26: ₹2,425 per quintal for Fair Average Quality (FAQ). Major mandis for wheat: Karnal, Hapur, Indore, Kota. Best time to sell wheat is April-May when demand peaks. Cold storage cost: ₹2-3 per quintal per month.",
            "Rice MSP 2025-26: Paddy (Common) ₹2,320/quintal, Grade A ₹2,360/quintal. Basmati rice premium at ₹6,000-8,000/quintal depending on variety. Major rice mandis: Karnal, Amritsar, Kurukshetra, Gondia.",
            "Soybean market trends: Prices range ₹4,200-5,500/quintal. Demand driven by crushing industry for oil extraction. Export demand increasing to Southeast Asia. Best mandis: Indore, Ujjain, Dewas. MSP: ₹4,892/quintal.",
            "Cotton market: Kapas MSP (medium staple) ₹7,121/quintal, long staple ₹7,521/quintal. CCI procurement active during October-March. Gujarat mandis: Rajkot, Gondal offer best prices. Avoid selling when moisture content exceeds 8%.",
            "Vegetable prices India: Tomato highly volatile ₹800-4,000/quintal seasonally. Onion prices peak during September-November, range ₹1,500-6,000/quintal. Potato cold storage advisable; prices peak in June-August. Direct farmer-to-consumer marketing through FPOs gives 20-40% higher returns.",
            "Pulses market: Chana (gram) MSP ₹5,650/quintal. Tur (pigeon pea) MSP ₹7,550/quintal. Moong (green gram) MSP ₹8,682/quintal — highest among pulses. Government procurement through NAFED at MSP when market prices fall.",
            "Spices market intelligence: Turmeric base price ₹8,000-15,000/quintal from Sangli, Erode mandis. Chilli prices range ₹12,000-25,000/quintal depending on variety and pungency. Black pepper ₹55,000-70,000/quintal from Kerala and Karnataka.",
            "FPO benefits for farmers: Farmer Producer Organizations help aggregate produce to get better prices. Government provides ₹18 lakh equity support to FPOs. FPOs can directly sell to processors, exporters eliminating middlemen. Cold chain infrastructure available through FPO scheme."
        ]
    },

    // ================================================================
    // WEATHER INTELLIGENCE — Climate & Weather Patterns
    // ================================================================
    {
        domain: "weather-intel",
        entries: [
            "Indian Monsoon patterns: Southwest monsoon arrives Kerala June 1 ± 7 days. Progresses to Northwest India by July 15. Withdrawal begins from Rajasthan September 1, complete withdrawal by October 15. El Niño years tend to have below-normal rainfall. La Niña years bring above-normal rainfall.",
            "Rabi season weather: Rabi crops (wheat, mustard, chickpea) grown October-March. Optimal wheat sowing temperature: 20-25°C. Night temperature below 5°C causes frost damage. Western disturbances bring beneficial rains in January-February. Excessive March heat causes forced maturity reducing yield.",
            "Kharif season weather: Kharif crops (rice, maize, soybean) grown June-October. Monsoon onset critical for sowing. Extended dry spells (>15 days) during monsoon season cause drought stress. Excessive rain during harvest causes grain spoilage. Cyclone risk on east coast October-December.",
            "Frost advisory for North India: Frost occurs when temperature drops below 0°C, typically December-January. Most vulnerable: mustard, potato, tomato, pea. Light irrigation evening before expected frost raises surface temperature. Smoke screens at farm borders help retain heat. Sulphuric acid spray 0.1% protects against frost injury.",
            "Heatwave impact on crops: Day temperature above 40°C for 3+ consecutive days is classified heatwave. Wheat grain shriveling above 35°C during grain filling. Rice spikelet sterility above 35°C. Provide light irrigation to reduce canopy temperature. Mulching with straw reduces soil temperature by 3-5°C.",
            "Drought management: Deficit rainfall below 20% of normal is moderate drought. Apply potassium chloride 1% spray to improve drought tolerance. Reduce plant population by 25% in drought conditions. Prefer drought-tolerant varieties. Rain water harvesting in farm ponds critical for supplemental irrigation.",
            "Cyclone preparedness: Coastal areas at risk October-December (East), May-June (West). Harvest standing crops before cyclone. Drain excess water from fields. Strengthen bunds around rice paddies. Post-cyclone: spray fungicide to prevent secondary infections from waterlogging."
        ]
    },

    // ================================================================
    // ROTATION MASTER — Crop Rotation & Soil Health
    // ================================================================
    {
        domain: "rotation-master",
        entries: [
            "Rice-Wheat rotation (Indo-Gangetic plains): Most common rotation in Punjab, Haryana, UP. Issues: declining soil health, groundwater depletion. Recommended fix: include green gram/moong between wheat harvest (April) and rice transplanting (June). This adds 20-25 kg nitrogen/ha to soil.",
            "Legume-cereal rotation benefits: Legumes fix 50-200 kg nitrogen/ha through root nodules (Rhizobium). Following cereal crop requires 25-50% less nitrogen fertilizer. Chickpea-wheat rotation ideal for Central India. Soybean-wheat rotation recommended for Madhya Pradesh.",
            "Sugarcane rotation: After 2-3 ratoon crops, soil becomes exhausted. Follow with: mustard or wheat for Rabi → green manure (dhaincha/sunhemp) → plant sugarcane again. This breaks pest cycle and replenishes organic matter. Avoid continuous sugarcane beyond 3 years.",
            "Soil health card-based rotation: pH 7.5-8.5 (alkaline) — grow rice, berseem, and apply gypsum. pH 5.5-6.5 (acidic) — apply lime, grow maize, finger millet. Low nitrogen — include legumes in rotation. Low potassium — include banana, potato rotation which respond well to K application.",
            "Cover crop options: Sunhemp (Crotalaria juncea) — fastest growing green manure, 45 days. Dhaincha (Sesbania) — excellent for rice fallows, fixes 80-100 kg N/ha. Berseem — Rabi season cover crop, can be cut 4-5 times for fodder. Incorporate green manure 45 days before next crop planting.",
            "Pest cycle disruption through rotation: Rice-Rice promotes stem borer buildup — break with pulse crop. Cotton-cotton increases bollworm pressure — rotate with legumes/cereals. Pigeon pea after soybean increases Fusarium wilt — avoid this sequence. Mustard after wheat disrupts aphid cycle.",
            "Three-year rotation plan for small farmers: Year 1 Kharif: Rice → Rabi: Wheat. Year 2 Kharif: Maize + Green gram → Rabi: Mustard. Year 3 Kharif: Soybean → Rabi: Chickpea → Summer: Green manure. This maintains soil fertility and breaks pest-disease cycles.",
            "Intercropping recommendations: Sugarcane + onion or garlic (short duration) maximizes land use. Maize + soybean (1:2 ratio) — nitrogen fixation benefits maize. Pearl millet + cluster bean — drought-hardy combination for Rajasthan. Pigeon pea + sorghum — traditional dryland combination."
        ]
    },

    // ================================================================
    // IRRIGATION PLANNER — Water Management
    // ================================================================
    {
        domain: "irrigation-planner",
        entries: [
            "Drip irrigation water savings: Saves 40-60% water compared to flood irrigation. Ideal for: sugarcane, cotton, vegetables, orchards. Government subsidy: 55% for small/marginal farmers, 45% for others under PMKSY. Installation cost: ₹40,000-80,000/acre depending on crop spacing.",
            "Wheat irrigation schedule: Critical stages — Crown Root Initiation (21 DAS), Tillering (40 DAS), Jointing (60 DAS), Flowering (80 DAS), Milk/Dough (100 DAS). If water is limited, prioritize CRI and Flowering stages. Each irrigation: 6-7 cm depth. Total water requirement: 40-45 cm for full season.",
            "Rice water management: Alternate Wetting and Drying (AWD) saves 20-30% water with no yield loss. Maintain 5 cm standing water during transplanting to 2 weeks after. Drain fields 2 weeks before harvest. System of Rice Intensification (SRI) reduces water use by 40% with wider spacing and intermittent irrigation.",
            "Micro-sprinkler for vegetables: Overhead sprinklers for leafy vegetables. Drip preferred for tomato, brinjal, chilli (reduces disease). Fertigation through drip improves fertilizer use efficiency by 30%. Mulch with black polythene + drip irrigation saves 50% water and suppresses weeds.",
            "Groundwater recharge: Farm pond dimensions: 20m x 20m x 3m deep stores 12 lakh liters. Recharge well near farm pond replenishes borewell. Contour bunding on sloping fields reduces runoff by 40%. Percolation tank on community land recharges multiple wells in 2 km radius.",
            "Irrigation scheduling by soil type: Sandy soil — irrigate every 3-4 days (low water holding capacity). Clay soil — irrigate every 7-10 days (high water holding). Loam soil — irrigate every 5-7 days (ideal for most crops). Use tensiometer to measure actual soil moisture for precision irrigation.",
            "Solar pump irrigation: KUSUM scheme provides 60% subsidy on solar water pumps. 5 HP solar pump irrigates 4-5 acres. No recurring electricity cost. Excess power can be sold to grid (Component C of KUSUM). Ideal for areas with limited electricity or diesel cost burden.",
            "Deficit irrigation strategy: For water-scarce regions, apply 70-80% of crop water requirement. Focus irrigation on critical growth stages. Paired row planting with drip in alternate furrows saves 30% water. Mulching with paddy straw reduces evaporation losses by 25-35%."
        ]
    },

    // ================================================================
    // TRAINING HUB — Fertilizer & Pesticide Safety
    // ================================================================
    {
        domain: "training-hub",
        entries: [
            "DAP (Diammonium Phosphate) application: Contains 18% N and 46% P2O5. Standard dose for wheat: 100 kg DAP/acre as basal. Apply in furrows 5 cm below seed. Do NOT mix DAP with urea at sowing — apply separately. Cost: ₹1,350/50 kg bag (subsidized). Avoid DAP in alkaline soils pH>8.5, use SSP instead.",
            "Urea application best practices: Contains 46% nitrogen. Wheat: 130 kg urea/acre in 3 splits — 1/3 at sowing, 1/3 at first irrigation (CRI), 1/3 at second irrigation. Rice: 110 kg urea/acre — apply in standing water 2-3 cm deep. Neem-coated urea reduces nitrogen losses by 10-15%. Never broadcast on dry soil.",
            "Organic alternatives to chemical fertilizers: Vermicompost: 2-3 tonnes/acre provides balanced NPK. Jeevamrit: fermented cow dung + urine + jaggery + gram flour. Apply 200L/acre every 15 days. Panchagavya: fermented preparation boosts crop immunity. Green manure: incorporate 45 days before planting.",
            "Pesticide safety PPE requirements: MANDATORY during mixing and spraying — rubber gloves, face mask/respirator, goggles, full-sleeve shirt and long pants, rubber boots. Wash hands thoroughly after handling. Do not eat, drink, or smoke while spraying. Re-entry interval: 24-48 hours for most pesticides.",
            "Integrated Pest Management (IPM): Step 1: Cultural control — crop rotation, resistant varieties, proper spacing. Step 2: Mechanical — pheromone traps, yellow sticky traps, light traps. Step 3: Biological — Trichogramma cards for stem borer, Trichoderma for soil fungus. Step 4: Chemical — only when pest crosses Economic Threshold Level (ETL).",
            "Soil testing and fertilizer recommendation: Soil test every 2-3 years. Collect samples from 15 cm depth at 5-6 spots in field. Free soil testing at government soil health card labs. Based on results: Low N (<200 kg/ha) — apply 120 kg N. Medium N (200-300) — apply 80 kg N. Sufficient N (>300) — apply 40 kg N. Similar for P and K.",
            "Safe pesticide storage: Store in original labeled container. Keep in locked storage away from food, feed, and children. Maintain at room temperature, not in direct sunlight. Triple-rinse empty containers and puncture to prevent reuse. Never transfer pesticides to food/drink containers — leading cause of accidental poisoning.",
            "Bio-fertilizer usage: Rhizobium for pulses and legumes — 200g/10 kg seed. Azotobacter for cereals and vegetables — 200g/10 kg seed or 2 kg/acre soil application. PSB (Phosphate Solubilizing Bacteria) — increases P availability by 25%. Mycorrhiza for trees and perennials — colonizes root system for nutrient uptake.",
            "Micronutrient deficiency correction: Zinc deficiency (rice, maize) — apply Zinc sulphate 25 kg/ha to soil or 0.5% foliar spray. Boron deficiency (mustard, sunflower) — Borax 10 kg/ha soil application. Iron deficiency (groundnut, soybean) — Ferrous sulphate 0.5% foliar spray at 30 and 45 DAS. Sulphur deficiency — Gypsum 200 kg/ha for oilseeds."
        ]
    },

    // ================================================================
    // VOICE AI / GENERAL — Government Schemes & General Info
    // ================================================================
    {
        domain: "voice-ai",
        entries: [
            "PM-KISAN scheme: Direct benefit transfer of ₹6,000/year in 3 installments of ₹2,000. Eligible: all landholding farmer families. Apply at local CSC center or through PM-KISAN portal. Documents needed: Aadhaar, bank account, land records.",
            "Pradhan Mantri Fasal Bima Yojana (PMFBY): Crop insurance premium — 2% for Kharif, 1.5% for Rabi, 5% for commercial crops. Government pays remaining premium. Coverage for drought, flood, hailstorm, pest/disease. Enroll through bank where crop loan is availed or nearest CSC.",
            "Kisan Credit Card (KCC): Short-term crop loan at 4% interest (with 3% interest subvention). Loan amount based on crop, area, and cost of cultivation. Covers crop production, post-harvest, and farm maintenance. Apply at any commercial, cooperative, or regional rural bank.",
            "Organic farming certification: Participatory Guarantee System (PGS) — free certification through groups. National Programme for Organic Production (NPOP) — for export-oriented organic farming. Conversion period: 2-3 years from conventional to certified organic. Premium of 20-50% over conventional produce prices.",
            "Farm mechanization schemes: Sub-Mission on Agricultural Mechanization (SMAM) provides 40-50% subsidy on farm equipment. Custom Hiring Centers (CHC) — rent tractors, harvesters at subsidized rates. Focus on small and marginal farmers who cannot afford own machinery.",
            "Farmer helpline and resources: Kisan Call Center — 1800-180-1551 (toll free, available in Hindi and regional languages). mKisan portal for SMS-based advisories. Crop-specific bulletins from ICAR/KVK. Local Krishi Vigyan Kendra (KVK) provides free training and demonstrations.",
            "Carbon credit opportunity for farmers: Zero-till farming earns carbon credits. Agroforestry eligible for carbon offset programs. Biochar application in soil sequesters carbon. Potential earning: ₹500-2,000/acre/year from carbon credits through registered programs.",
            "Digital agriculture tools: Soil Health Card available online. e-NAM (National Agriculture Market) for online mandi trading across states. Weather-based crop insurance through WBCIS. AgriStack — digital infrastructure for agriculture being developed by Government of India."
        ]
    },
]
