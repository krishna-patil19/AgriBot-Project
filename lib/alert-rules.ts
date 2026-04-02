// Alert Rules engine

export type AlertPriority = "high" | "medium" | "low"

export interface AlertRule {
  id: string
  check: (data: AlertData) => boolean
  message: (data: AlertData, lang: string) => string
  priority: AlertPriority
}

export interface AlertData {
  farmer: any
  weather: any
  mandiPrices: any[]
}

// Crop name translations for Hindi and Marathi
const CROP_TRANSLATIONS: Record<string, Record<string, string>> = {
  wheat: { hi: 'गेहूं', mr: 'गहू' },
  rice: { hi: 'चावल', mr: 'तांदूळ' },
  cotton: { hi: 'कपास', mr: 'कापूस' },
  sugarcane: { hi: 'गन्ना', mr: 'ऊस' },
  soybean: { hi: 'सोयाबीन', mr: 'सोयाबीन' },
  soyabean: { hi: 'सोयाबीन', mr: 'सोयाबीन' },
  maize: { hi: 'मक्का', mr: 'मका' },
  corn: { hi: 'मक्का', mr: 'मका' },
  jowar: { hi: 'ज्वार', mr: 'ज्वारी' },
  sorghum: { hi: 'ज्वार', mr: 'ज्वारी' },
  bajra: { hi: 'बाजरा', mr: 'बाजरी' },
  millet: { hi: 'बाजरा', mr: 'बाजरी' },
  groundnut: { hi: 'मूंगफली', mr: 'भुईमूग' },
  peanut: { hi: 'मूंगफली', mr: 'भुईमूग' },
  onion: { hi: 'प्याज', mr: 'कांदा' },
  tomato: { hi: 'टमाटर', mr: 'टोमॅटो' },
  potato: { hi: 'आलू', mr: 'बटाटा' },
  gram: { hi: 'चना', mr: 'हरभरा' },
  chana: { hi: 'चना', mr: 'हरभरा' },
  chickpea: { hi: 'चना', mr: 'हरभरा' },
  tur: { hi: 'तूर', mr: 'तूर' },
  toor: { hi: 'तूर', mr: 'तूर' },
  pigeon_pea: { hi: 'तूर दाल', mr: 'तूर डाळ' },
  urad: { hi: 'उड़द', mr: 'उडीद' },
  moong: { hi: 'मूंग', mr: 'मूग' },
  mustard: { hi: 'सरसों', mr: 'मोहरी' },
  turmeric: { hi: 'हल्दी', mr: 'हळद' },
  chilli: { hi: 'मिर्च', mr: 'मिरची' },
  banana: { hi: 'केला', mr: 'केळी' },
  mango: { hi: 'आम', mr: 'आंबा' },
  grapes: { hi: 'अंगूर', mr: 'द्राक्षे' },
  pomegranate: { hi: 'अनार', mr: 'डाळिंब' },
  crops: { hi: 'फसल', mr: 'पीक' },
}

function translateCrop(crop: string, lang: string): string {
  if (lang === 'en') return crop
  return CROP_TRANSLATIONS[crop.toLowerCase()]?.[lang] || crop
}

export const ALERT_RULES: AlertRule[] = [
  {
    id: "high-temp",
    check: (data) => data.weather?.main?.temp > 35,
    message: (data, lang) => {
        const t = Math.round(data.weather.main.temp)
        const c = data.farmer?.crops?.[0] || 'crops'
        const tc = translateCrop(c, lang)
        if (lang === 'hi') return `${t}°C तापमान होने की संभावना है — अपनी ${tc} फसल को बचाने के लिए सिंचाई बढ़ाएं।`
        if (lang === 'mr') return `${t}°C तापमान असण्याची शक्यता आहे — तुमचे ${tc} पीक वाचवण्यासाठी सिंचन वाढवा.`
        return `Temperature of ${t}°C expected — increase irrigation frequency to protect your ${tc}.`
    },
    priority: "high",
  },
  {
    id: "heavy-rain",
    check: (data) => {
      const condition = data.weather?.weather?.[0]?.main?.toLowerCase() || ""
      const isRain = condition.includes("rain") || condition.includes("storm")
      return isRain
    },
    message: (_, lang) => {
        if (lang === 'hi') return 'भारी बारिश की संभावना है — कीटनाशकों का छिड़काव रोक दें और खेत से पानी निकलने की व्यवस्था जांचें।'
        if (lang === 'mr') return 'मुसळधार पावसाची शक्यता आहे — कीटकनाशकांची फवारणी थांबवा आणि शेतातील पाण्याचा निचरा तपासा.'
        return 'Heavy rain expected — delay spraying pesticides and check field drainage.'
    },
    priority: "high",
  },
  {
    id: "low-humidity-pest",
    check: (data) => data.weather?.main?.humidity < 40 && data.weather?.main?.temp > 30,
    message: (_, lang) => {
        if (lang === 'hi') return 'शुष्क और गर्म मौसम — मकड़ी के जाले (स्पाइडर माइट्स) लगने का उच्च जोखिम। फसल के पत्तों की बारीकी से जांच करें।'
        if (lang === 'mr') return 'कोरडे आणि गरम हवामान — स्पायडर माइट्स (कोळी) लागण्याचा उच्च धोका. पिकाच्या पानांचे बारकाईने निरीक्षण करा.'
        return 'Dry and hot conditions — high risk of spider mites. Monitor crop leaves closely.'
    },
    priority: "medium",
  },
  {
    id: "mandi-price-high",
    check: (data) => {
        return data.mandiPrices?.some(p => Number(p.modal_price) > 3000) || false
    },
    message: (data, lang) => {
        const p = data.mandiPrices?.find(p => Number(p.modal_price) > 3000)
        const crop = p?.commodity || 'crops'
        const price = p?.modal_price || '0'
        const mandi = p?.market || 'mandi'
        const tc = translateCrop(crop, lang)
        if (lang === 'hi') return `${mandi} मंडी में ${tc} का अच्छा भाव (₹${price}/क्विंटल) — जल्द बेचने पर विचार करें।`
        if (lang === 'mr') return `${mandi} मंडईत ${tc} चा चांगला भाव (₹${price}/क्विंटल) — लवकर विकण्याचा विचार करा.`
        return `Good price for ${tc} (₹${price}/Quintal) at ${mandi} mandi — consider selling soon.`
    },
    priority: "medium",
  },
  {
    id: "cold-snap-warning",
    check: (data) => data.weather?.main?.temp < 10,
    message: (_, lang) => {
        if (lang === 'hi') return 'शीत लहर आने वाली है — संवेदनशील फसलों को पाले से बचाएं।'
        if (lang === 'mr') return 'थंडीची लाट येणार आहे — नाजूक पिकांना धोक्यापासून वाचवा.'
        return 'Cold snap approaching — protect sensitive crops from frost.'
    },
    priority: "high"
  }
]
