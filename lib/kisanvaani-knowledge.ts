/**
 * KisanVaani Agriculture QA Knowledge Base
 * Source: HuggingFace dataset "KisanVaani/agriculture-qa-english-only"
 * Total entries: 22,615 Q&A pairs (curated selection of most relevant entries)
 * 
 * Integrated into AgriBot's RAG engine to provide comprehensive agricultural answers.
 * Each entry is formatted as "Q: [question] A: [answer]" for optimal retrieval.
 */

export const KISANVAANI_KNOWLEDGE: { domain: string; entries: string[] }[] = [
    // ================================================================
    // CROP ROTATION & SOIL HEALTH
    // ================================================================
    {
        domain: "rotation-master",
        entries: [
            "Q: Why is crop rotation important in farming? A: Crop rotation helps prevent soil erosion and depletion, and can also help to control pests and diseases. It is the practice of growing a series of different crops in the same area over several seasons.",
            "Q: What farming practice helps prevent soil erosion? A: Crop Rotation is one of the most effective practices. Also planting cover crops, using conservation tillage practices, and building contour terraces help. Avoid overgrazing and maintain vegetation along streams.",
            "Q: What is soil fertility? A: Soil fertility is the ability of soil to sustain plant growth and optimize crop yield. It can be improved by incorporating cover crops that add organic matter to the soil.",
            "Q: What causes soil degradation? A: Erosion, compaction, and nutrient depletion are the primary causes of soil degradation.",
            "Q: What is soil science and management? A: Soil science and management is the scientific study of the physical, chemical, and biological properties of soil and the ways in which it can be managed for optimal crop production. Scientists study texture, structure, acidity, nutrient content, and microbial communities.",
            "Q: What is tillage? A: Tillage is the practice of breaking up the soil with tools such as the plow or harrow to prepare for planting, for nutrient incorporation, or for pest control. Excessive tillage can lead to soil erosion and nutrient loss.",
            "Q: What are cover crops? A: Cover crops are plants planted to cover the soil rather than for harvesting. They manage soil erosion, fertility, quality, water, weeds, pests, diseases, and biodiversity. They are sometimes called nurse crops or green manure.",
            "Q: What is crop rotation in soil management? A: A technique to reduce soil-borne diseases and pests and improve soil fertility. It helps maintain soil health and improve crop yields over time.",
            "Q: What are the principal factors of soil quality? A: Soil salination, pH, microorganism balance, and the prevention of soil contamination are the principal factors of soil quality.",
            "Q: What is monoculture vs intercropping vs multiple cropping? A: Monoculture is planting one cultivar on large acreage. Multiple cropping grows several crops sequentially in one year. Intercropping grows several crops at the same time in the same field.",
            "Q: What is shifting cultivation (slash and burn)? A: A system in which forests are burnt, releasing nutrients to support cultivation of annual and then perennial crops for a period of several years.",
            "Q: What is a ratoon crop? A: A sprout or shoot from the root, stem or vine of a plant after it has been cut back. Common in sugarcane farming.",
        ]
    },

    // ================================================================
    // IRRIGATION & WATER MANAGEMENT
    // ================================================================
    {
        domain: "irrigation-planner",
        entries: [
            "Q: What are the different methods of irrigation? A: Surface irrigation, drip irrigation, sprinkler irrigation, flood irrigation, and furrow irrigation are the main methods. Drip irrigation applies water directly to the root zone through pipes and emitters, while sprinkler irrigation sprays water over the field.",
            "Q: What is irrigation? A: Irrigation is the process of applying water to crops to supplement natural rainfall and ensure healthy plant growth. It is essential in areas with low rainfall or unreliable water sources.",
            "Q: Do farmers waste water? A: No. Farmers are focused on conserving water because: 1) Water wasted means lack for future crops 2) Water is expensive 3) They use precise technology to know exactly how much water a plant needs 4) Many rely on Mother Nature for water.",
            "Q: What is consumptive water use? A: Water used and not returned to the original source. Farmers minimize this through technology.",
            "Q: Poor irrigation leads to what? A: Waterlogging, soil salinization, and other negative environmental consequences.",
            "Q: How can I differentiate sprinkler from drip irrigation? A: Sprinkler irrigation sprays water over the field, while drip irrigation applies water directly to the root zone through a system of pipes and emitters. Drip is more water-efficient.",
            "Q: What are common water management practices? A: Soil moisture monitoring, crop water requirements estimation, crop selection, crop rotation, irrigation scheduling, water storage, and distribution systems.",
            "Q: What water conservation practices exist? A: Reducing evaporation loss, controlling water runoff, maintaining proper soil moisture levels, and using cover crops as mulch to shade and cool the soil surface.",
        ]
    },

    // ================================================================
    // PEST & DISEASE MANAGEMENT
    // ================================================================
    {
        domain: "agri-detect",
        entries: [
            "Q: What is pest management? A: Pest management is the practice of controlling pests and diseases that can damage crops. Methods include biological control, cultural control, and chemical control.",
            "Q: What is Integrated Pest Management (IPM)? A: IPM is a holistic approach that uses multiple methods including biological control, cultural control, and chemical control. It minimizes pesticide use while effectively controlling pests. Steps: 1) Cultural control 2) Mechanical (traps) 3) Biological 4) Chemical only when pest crosses Economic Threshold Level.",
            "Q: What are common pests affecting maize? A: Corn borers, armyworms, rootworms, cutworms, and aphids. Diseases like corn smut and gray leaf spot also affect maize. Control with chemical or organic pesticides and proper crop rotation.",
            "Q: What is the Fall Armyworm? A: A major invasive pest first detected in Uganda in 2016. It can reproduce quickly and cause yield losses of up to 50%, sometimes total crop failure. It affects maize, sorghum, millet, and rice.",
            "Q: How to control armyworms? A: Early detection, biological control, chemical control, crop rotation, and cultural control. Use pheromone traps for monitoring. The pest can fly long distances making containment difficult.",
            "Q: What causes plant diseases? A: A variety of pathogens including fungi, bacteria, viruses, and nematodes.",
            "Q: How to control fungal diseases in tomato plants? A: Ensure good airflow by spacing and pruning. Use fungicide. Avoid overhead watering which spreads spores. Remove infected plants immediately.",
            "Q: What are common pests attacking apple trees? A: Codling moths, apple maggots, and aphids. Use pheromone traps, insecticides, or natural predators like ladybugs.",
            "Q: What is Cassava Mosaic Disease (CMD)? A: Caused by Begomovirus. Symptoms include distorted yellow leaves, poor tuber formation, stunted plants. Control by planting resistant varieties, using virus-free planting materials, and good field sanitation. Spread by whitefly infestations.",
            "Q: What are the symptoms of Cassava Bacterial Blight (CBB)? A: Wilting, yellowing of leaves, and rotting of stems and roots.",
            "Q: What are sustainable approaches to pest management? A: Breeding disease-resistant varieties, using natural pest control methods, crop rotation, and intercropping.",
        ]
    },

    // ================================================================
    // SEED & CROP RECOMMENDATIONS
    // ================================================================
    {
        domain: "seed-sage",
        entries: [
            "Q: How can I increase potato crop yield? A: Improve soil fertility using organic matter and maintaining proper soil pH. Use certified disease-free seed tubers. Ensure adequate irrigation at critical growth stages.",
            "Q: What is the best time to plant soybeans? A: Between late April and mid-May in most temperate regions. Soil temperature should be at least 50°F (10°C).",
            "Q: What is the ideal planting density for maize? A: Around 70,000 to 80,000 plants per hectare for optimal yield. Spacing of 20-30 cm between plants and 60-75 cm between rows. May vary by variety, water, and nutrient availability.",
            "Q: What type of soil is best for growing beans? A: Beans require well-draining loamy soil with pH between 6.0 and 7.5. Prepare by removing weeds and incorporating organic matter like compost or manure.",
            "Q: How long do beans take from planting to harvest? A: 75 to 90 days depending on the variety. Bush beans and pole beans are the two main types.",
            "Q: What is seed dormancy? A: The condition where a seed fails to germinate even under favorable conditions. Caused by mechanical barriers, chemical inhibitors, immature embryos, scarification requirements, and environmental cues.",
            "Q: What is seed treatment? A: The process of applying chemical or biological agents to seeds before planting to protect against soil-borne diseases. Common agents include Thiram (fungicide for damping-off, seed rot, seedling blight).",
            "Q: What is the recommended spacing for cassava? A: 1.0 m x 1.0 m (3 ft x 3 ft) is commonly used for cassava planting.",
            "Q: When is corn ready to harvest? A: When kernels are firm and full-sized, ears look mature, husks have turned brown and dry. Test kernel moisture with a moisture meter.",
            "Q: What are the ideal conditions for planting maize? A: Well-draining soils with pH between 5.5 and 7.5, full sunlight, adequate moisture during germination.",
            "Q: What fertilizers for maize? A: DAP, NPK, and CAN. Apply CAN after 2-3 weeks or when crop is about 45cm high.",
            "Q: What is the recommended fertilizer dosage for strawberries in sandy soil? A: A balanced fertilizer with NPK ratio of 10-10-10 is recommended for sandy soil. Exact dosage varies by specific soil conditions and plant age.",
        ]
    },

    // ================================================================
    // FERTILIZER & CHEMICAL SAFETY
    // ================================================================
    {
        domain: "training-hub",
        entries: [
            "Q: What are organic fertilizers? A: Made from natural materials such as manure, compost, and plant residues. They improve both soil structure and nutrient content.",
            "Q: What are fertilizers? A: Substances added to soil to improve crop growth and quality. Types include organic (natural materials) and synthetic (chemical/inorganic).",
            "Q: Why are pesticides used? A: To protect crops from insect pests, weeds, and fungal diseases during growth. Also to prevent rats, mice, and insects from contaminating food during storage.",
            "Q: What are the primary macronutrients (NPK)? A: Nitrogen (N) - essential for chlorophyll production and photosynthesis. Phosphorus (P) - important for root development, flowering, fruiting. Potassium (K) - helps with water regulation, disease resistance, stress tolerance.",
            "Q: What does nitrogen deficiency cause? A: Stunted growth, yellowing leaves, and reduced yield.",
            "Q: What does phosphorus deficiency cause? A: Poor root development, slow growth, and reduced flowering and fruiting.",
            "Q: What are micronutrient deficiency symptoms? A: Leaf discoloration, reduced growth, and poor reproductive performance. Common deficiencies include iron, zinc, and manganese.",
            "Q: What forms can fertilizers be applied in? A: Granular, liquid, and foliar applications.",
            "Q: What is the basic principle of organic farming? A: Keeping the soil rich with nutrients by feeding it natural fertilizers like cow manure. Uses crop rotation, composting, and biological pest control instead of synthetic chemicals.",
            "Q: What is Rotenone? A: A plant extract found in some species within the pea family, used as a natural pesticide.",
            "Q: What are the safety precautions for pesticide use? A: Always use PPE (protective equipment), follow label instructions, avoid eating/drinking while spraying, maintain safe re-entry intervals.",
        ]
    },

    // ================================================================
    // MARKET & ECONOMICS
    // ================================================================
    {
        domain: "market-oracle",
        entries: [
            "Q: Does most of the money I pay for food go back to the farmer? A: Not necessarily. Input costs like land, equipment, fertilizer, chemicals, seed, buildings, maintenance, labor, fuel, taxes, and insurance all affect what farmers receive.",
            "Q: Does a large farm mean it is a corporate farm? A: No. Just because a farm is large in acres does not mean it is corporate. America's farms are still largely family farms.",
            "Q: Is agriculture a luxury or national security? A: Agriculture is a matter of national security. It creates jobs, helps the economy, and provides basic necessities.",
            "Q: What is the Food Supply Continuum? A: The process of getting food from farm to table in three phases: pre-harvest (producer, transport, marketing), harvest (harvesting and processing), and post-harvest (retailing, food service, reaching consumer).",
            "Q: What percentage does agriculture contribute to greenhouse gas emissions? A: About 9% of total US greenhouse gas emissions. Methane emissions have declined 35% since 1975.",
            "Q: How many pounds of grain does it take to produce 1 pound of beef? A: 2.5 pounds of grain per pound of beef.",
        ]
    },

    // ================================================================
    // WEATHER & CLIMATE
    // ================================================================
    {
        domain: "weather-intel",
        entries: [
            "Q: How does climate change affect agriculture? A: Changes in temperature, rainfall, and weather patterns lead to decreased crop yields, increased pest and disease pressure, and other challenges for farmers.",
            "Q: What are the effects of reliable rainfall? A: Improved crop yields, better soil health, enhanced biodiversity, reduced risk of drought, and improved water quality.",
            "Q: What are heatwave effects on crops? A: Extreme heat causes wheat grain shriveling, rice spikelet sterility, and general crop stress when temperatures exceed 35-40°C for extended periods.",
            "Q: What are some sustainable farming practices for environmental impact? A: Conservation tillage, crop rotation, cover cropping, integrated pest management, drip irrigation, and carbon sequestration through soil management.",
        ]
    },

    // ================================================================
    // GENERAL AGRICULTURE & GOVERNMENT SCHEMES
    // ================================================================
    {
        domain: "voice-ai",
        entries: [
            "Q: What is organic farming? A: Method of crop production emphasizing natural and sustainable practices like crop rotation, composting, and biological pest control. Minimizes synthetic chemicals and promotes soil and environmental health.",
            "Q: What are GMOs (Genetically Modified Organisms)? A: Organisms with DNA altered in ways not occurring naturally. They can enhance pest resistance, improve nutrition, and other characteristics. Concerns include safety and environmental impacts.",
            "Q: What is precision agriculture? A: Use of technology (sensors, drones, GPS) to optimize crop production and reduce waste. Collects data on soil moisture, nutrient levels, and other factors for informed planting and harvesting decisions.",
            "Q: What is animal husbandry? A: The breeding and raising of animals for meat, milk, eggs, wool, and work/transport.",
            "Q: What is aquaculture? A: Production of fish for human consumption. Common fish include salmon, catfish, rainbow trout, tilapia, and cod.",
            "Q: What does agriculture encompass? A: Crop and livestock production, aquaculture, fisheries, and forestry for food and non-food products. Major products include foods, fibers, fuels, and raw materials.",
            "Q: What are important categories of food crops? A: Cereals, legumes, forage, fruits, and vegetables.",
            "Q: What is agricultural automation? A: Autonomous navigation by robots without human intervention for farming tasks.",
            "Q: What kind of technology do farmers use? A: GPS for tracking every farm location and knowing soil needs. Auto-steer tractors, drones, and RFID for livestock tracking.",
            "Q: What is Payment for Ecosystem Services? A: A method of providing additional incentives to encourage farmers to conserve aspects of the environment.",
            "Q: What is crop protection? A: Various methods to protect crops from pests, diseases, and threats, including pesticides, fungicides, and cultural practices like crop rotation and intercropping.",
            "Q: What are carbon credit opportunities for farmers? A: Zero-till farming, agroforestry, and biochar application earn carbon credits. Potential earning: ₹500-2,000 per acre per year.",
        ]
    },
]
