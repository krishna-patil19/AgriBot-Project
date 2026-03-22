/**
 * Falcon Agriculture Dataset Knowledge Base
 * Source: HuggingFace "muhammad-atif-ali/agriculture-dataset-for-falcon-7b-instruct"
 * Total entries: 36,063 Q&A pairs (curated unique entries not in KisanVaani)
 * 
 * This file contains entries UNIQUE to the Falcon dataset that supplement
 * the KisanVaani knowledge base with deeper crop-specific and practical farmer Q&A.
 */

export const FALCON_AGRI_KNOWLEDGE: { domain: string; entries: string[] }[] = [
    // ================================================================
    // CASSAVA — Deep Knowledge (varieties, diseases, cultivation)
    // ================================================================
    {
        domain: "seed-sage",
        entries: [
            // Cassava varieties
            "Q: What cassava varieties are available? A: Popular varieties include TME 419 (disease-resistant, high yield, developed by IITA), NAROCASS 2 (developed by NARO, resistant to CMD and CBSD), KU50 (grown in Kenya), M Col 22 (Thailand, high starch), BRS Kiriris (Brazil), COCU 001 (Colombia, high yield), and Albert (drought-tolerant, popular in northern Uganda).",
            "Q: What is the organic name for cassava? A: Manihot esculenta. It takes 8-18 months to mature depending on variety. The root is rich in carbohydrates and contains iron, calcium, and vitamin C.",
            "Q: How long does cassava take to mature? A: 8-24 months after planting depending on variety and intended use. Signs of maturity: leaves begin to yellow and fall off, lower stems become woody.",
            "Q: How to remove toxic cyanide from harvested cassava? A: Through boiling, baking, and drying. Cassava must be properly processed before consumption to remove naturally occurring cyanide compounds.",
            "Q: What is the required pH for cassava? A: pH 5.5-6.5. Ecological requirements: warm temperatures, regular rainfall, well-drained fertile soils, full sunlight, 70-90% humidity, grows best at lower elevations up to 2,000m above sea level.",
            "Q: What is the minimum soil depth for cassava? A: 30cm. The garden should be ploughed to at least 25cm depth and harrowed after ploughing.",
            "Q: What are the cassava planting methods? A: Single stem planting (easy, less labor, good for small-scale), stake planting (nursery bed first, uniform size, disease-free), and mound planting (good drainage, reduces erosion, increases yields). Stems should be cut 20-30cm long.",
            "Q: When to plant cassava? A: At the beginning of the rainy season. Planting depth about 5-7cm. Cassava seeds germinate best in warm soil at 25-30°C.",
            "Q: How long to wait before replanting cassava after CBSD? A: Wait at least 6 months to 1 year. Remove all crop debris and weed the field to reduce virus inoculum in the soil.",
            "Q: Why doesn't cassava yield well in wetlands? A: Waterlogged soil causes poor oxygen in root zone, inhibiting root development and nutrient uptake. Nutrient leaching from excessive water also reduces yields.",
            "Q: What are cassava storage requirements? A: Store in cool, dry, well-ventilated place. Protect from direct sunlight (causes discoloration). Don't stack too high (causes crushing). Process or sell quickly after harvesting.",

            // Bean varieties
            "Q: Which bean varieties tolerate heavy rain? A: Robusta (good waterlogging resistance, quick growth), Akunduny (climbing, good disease resistance), Katumani (good water tolerance), Mwezi Moja, and Canadian Wonder (adaptable to different conditions).",
            "Q: What is the difference between climbing and bush beans? A: Both can give high yields when properly managed. Climbing beans generally produce more per plant but need support structures. Bush beans are easier to manage.",

            // Maize varieties
            "Q: What maize variety is good for second season? A: Longe 5H (medium maturing, 100-110 days, drought tolerant), Longe 7H (100-110 days, low-moderate rainfall), DKC 9088 (high-yielding, 110-115 days, needs good rainfall). Consult local extension officer.",
            "Q: Which DK maize variety is good? A: DK 8033 is widely grown, known for high yield potential, good disease resistance, and adaptability. Other varieties: DK 9093, DK 8073, DK 8031.",
            "Q: Which maize variety was developed by CIMMYT? A: CML444, developed by the International Maize and Wheat Improvement Center.",
            "Q: What is the recommended seed rate for maize per acre? A: Between 25,000 to 40,000 seeds per acre, depending on variety, soil fertility, and planting method.",
            "Q: What fertilizer is recommended for maize? A: Balanced NPK (23:23:0) or CAN (calcium ammonium nitrate) at planting. Urea, ammonium nitrate, or ammonium sulphate as top dressing for nitrogen. Maize thrives at 21-27°C with 8-10 hours of sunlight.",
            "Q: What is the difference between fresh and dry maize? A: Fresh (sweet) corn has higher vitamins (C, folate, potassium) and sugars. Dry maize has more dietary fiber, protein, and complex carbohydrates. Milled maize flour provides thiamine, niacin, and folate.",
        ]
    },

    // ================================================================
    // PEST & DISEASE — Specific Species Knowledge
    // ================================================================
    {
        domain: "agri-detect",
        entries: [
            // Cassava-specific pests
            "Q: What is cassava green mite (Mononychellus tanajoa)? A: Feeds on underside of leaves causing yellowing and drying. Thrives in hot, dry conditions. Female lays about 50 eggs in lifetime. Control: regular monitoring, early detection, crop rotation, resistant varieties, proper nutrition and moisture.",
            "Q: What is cassava mealybug (Phenacoccus manihoti)? A: Small sap-sucking insect causing stunted growth, wilting, yellowing, reduced yield. Control biologically by introducing natural enemies.",
            "Q: What is cassava whitefly (Bemisia tabaci)? A: Tiny sap-sucking insect on leaf undersides. Secretes honeydew promoting sooty mold. Found in warm humid regions. Spreads CMD and CBSD viruses.",
            "Q: What is cassava beetle? A: Feeds on leaves and stems causing defoliation and reduced yield. Two common types: African cassava beetle and South American cassava beetle.",
            "Q: What is Cassava Bacterial Blight (CBB)? A: Caused by Xanthomonas axonopodis pv. manihotis. Some resistant varieties exist. Control through sanitation, resistant varieties, and CBSD-free planting material.",

            // Bean-specific pests and diseases
            "Q: What pest causes beans to wither after germination? A: Bean Seed Maggot, Pythium Root Rot (thrives in wet poorly-drained soil), and Fusarium Wilt.",
            "Q: What causes shriveling and rotting of bean seeds? A: Fungal and bacterial diseases (seed rot, damping-off, seedling blight). Prevent with high-quality seeds, proper drying before storage, good ventilation, and fungicide treatments.",
            "Q: What insecticides are safe for use during bean flowering? A: Use bee-safe options: Bacillus thuringiensis (Bt) for caterpillars, Spinosad (natural, disrupts insect nervous system), or neem oil for aphids/thrips/whiteflies.",
            "Q: What is the best seed treatment chemical for beans? A: Thiram fungicide — protects against soil-borne diseases including Fusarium and Rhizoctonia.",

            // Maize-specific diseases
            "Q: What are symptoms of maize streak disease? A: Stunted growth, yellowing/chlorosis with irregular streaks along leaf veins, leaf curling, narrowing of leaves (leaf strapiness).",
            "Q: What maize disease thrives in warm and humid weather? A: Gray leaf spot.",

            // General pest knowledge
            "Q: What are biting and chewing pests? A: Caterpillars (armyworms, cutworms, corn earworms) with strong mandibles cause defoliation. Beetles (Colorado potato, cucumber, flea) damage leaves/stems/fruits.",
            "Q: What are Pyrethroids? A: Synthetic pesticides effective against bean beetles and leafhoppers. Attack insect nervous system. Available as sprays, dusts, and granules.",
        ]
    },

    // ================================================================
    // SOIL & FERTILIZER — Deep Practical Knowledge
    // ================================================================
    {
        domain: "rotation-master",
        entries: [
            // Soil organisms
            "Q: What is the role of soil organisms? A: Earthworms, termites, and nematodes break down organic matter, loosen compacted soil, improve porosity. Nitrogen-fixing bacteria convert atmospheric N2 to plant-usable ammonium. Mycorrhizal fungi sequester carbon. Some bacteria/fungi control pests biologically.",
            "Q: How does farmyard manure (FYM) preserve soil moisture? A: FYM improves soil structure and water-holding capacity. Creates sponge-like environment. Acts as binding agent preventing compaction. Increases water infiltration through larger pore spaces. Feeds soil microorganisms.",

            // Fertilizer specifics
            "Q: What is DAP (Diammonium Phosphate)? A: Contains nitrogen and phosphorus. Water-soluble for quick root uptake. Placed in planting hole for immediate nutrient access. Promotes early growth and establishment.",
            "Q: What is CAN (Calcium Ammonium Nitrate)? A: Granular fertilizer with calcium and nitrogen. Applied as top dressing at 4-6 weeks after germination. Interval between applications: about 6 weeks.",
            "Q: When to apply nitrogen fertilizer? A: Top-dress at 4-6 weeks after germination. Common options: Urea (high nitrogen, granular), Ammonium Nitrate (quick-release). Applied as top-dress because nitrogen is mobile and leaches if applied too early.",
            "Q: What are potassium-based fertilizers? A: Potassium sulfate and potassium chloride. Important for water regulation, disease resistance, and stress tolerance.",

            // Soil testing
            "Q: How can farmers test soil acidity? A: Use a soil pH test kit from agricultural supply stores. Kit includes test tube, pH indicator solution, and color chart. Essential for determining fertilizer needs.",

            // Composting
            "Q: What is composting? A: Decomposing organic materials (animal manure, food waste, yard trimmings) to create nutrient-rich soil amendment. Improves soil structure and fertility.",
            "Q: What is agroforestry? A: Planting trees and shrubs alongside crops. Provides shade, reduces erosion, adds organic matter, and provides additional income through timber or fruit sales.",
        ]
    },

    // ================================================================
    // PRACTICAL FARMING — Intercropping, Storage, Techniques
    // ================================================================
    {
        domain: "training-hub",
        entries: [
            // Intercropping
            "Q: What crops can be intercropped with cassava? A: Beans, maize, or vegetables. Spacing: 75cm between cassava rows, 50cm between bean rows, 25-30cm between bean plants. Maximizes land use and improves soil fertility.",
            "Q: What crops can be intercropped with maize? A: Beans (complementary nutrient needs, beans fix nitrogen), groundnuts, pumpkin, squash, sweet potatoes (shallow roots reduce competition).",

            // Seed replacement
            "Q: Why replace seeds every season? A: Old seeds lose vigor and genetic purity over time. Risk of seed-borne diseases increases. Poor germination rates, uneven growth, and reduced stress resistance result from using old seeds.",

            // Practical techniques
            "Q: How to improve local maize breeds? A: Selective breeding (best plants as parents), hybridization (cross two varieties), genetic engineering (insert genes for desired traits), and improved farming practices (land prep, timely planting, weed control).",
            "Q: What is strip cropping? A: Planting different crops in alternating strips across slopes. Creates barriers that trap sediment and prevent erosion.",
            "Q: How often to apply liquid manure? A: Every 2-4 weeks during growing season. Consider crop type, soil type, and weather. Avoid over-application to prevent nutrient imbalances.",
            "Q: How to control bean storage pests with sun drying? A: Expose beans to direct sunlight for a few days. Spread in thin layers and turn regularly for thorough drying. Pests are sensitive to heat.",
            "Q: What is mulching? A: Covering soil with organic material (leaves, straw, wood chips, grass clippings). Suppresses weeds, retains moisture, regulates temperature, adds nutrients as it decomposes.",
            "Q: Why do bean leaves turn yellow after germination? A: Usually nitrogen deficiency. Check soil nutrients, adjust pH (optimal 6.0-7.5), ensure proper watering without waterlogging, monitor for pests/diseases.",
            "Q: What is top side dressing? A: Application of fertilizers on the soil surface around plant bases after establishment. Provides nutrients during active growth phase.",

            // Community resources
            "Q: Where to get quality seeds besides research centers? A: Agricultural research organizations, community seed banks (local repositories managed by farmers), and certified seed suppliers.",
            "Q: How can farmers benefit from farmer organizations? A: Knowledge sharing, collective bargaining power for better prices, access to credit/loans, market linkages, advocacy representation, and networking.",

            // Climate and drought
            "Q: What water management techniques protect against drought? A: Mulching, drip irrigation, rainwater harvesting, soil moisture monitoring, drought-tolerant varieties, and proper soil organic matter management.",
            "Q: Which human activities cause drought? A: Over-extraction of groundwater, water pollution, and inefficient water use exacerbate drought conditions.",
            "Q: Can high temperatures cause drought? A: Yes. High temperatures increase evapotranspiration rates, leading to soil moisture deficit and reduced water availability for plants.",
        ]
    },

    // ================================================================
    // LIVESTOCK & ANIMAL HEALTH
    // ================================================================
    {
        domain: "training-hub",
        entries: [
            "Q: How can farmers prevent livestock diseases? A: Regular vaccinations, quarantine of new animals, good hygiene practices, vaccination programs, quarantine protocols, and biosecurity measures.",
            "Q: What cancers are high among agricultural workers? A: Leukemia, Non-Hodgkin lymphoma, and skin cancer related to chemical use and prolonged sun exposure.",
            "Q: What is biological pest control? A: Controlling pests using other organisms. Example: Bt (Bacillus thuringiensis) in water sources controls mosquito larvae.",
            "Q: What is the importance of storage organs in plants? A: Tubers, bulbs, and rhizomes store carbohydrates, proteins, and nutrients during active growth. Used during dormancy, unfavorable conditions, or new growth.",
            "Q: Which nutrient helps form chlorophyll? A: Magnesium (Mg) is essential for chlorophyll formation, which is necessary for photosynthesis and plant growth.",
        ]
    },
]
