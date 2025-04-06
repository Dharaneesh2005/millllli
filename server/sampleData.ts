import { InsertProduct } from "@shared/schema";

// This serves as our initial data to populate the database

export const sampleProducts: InsertProduct[] = [
  {
    name: "Organic Foxtail Millet",
    slug: "organic-foxtail-millet",
    description: "Foxtail millet is one of the oldest cultivated millets, known for its high nutritional value. It's rich in complex carbohydrates, dietary fiber, and essential minerals like iron and calcium. Our organic foxtail millet is grown without pesticides, making it a healthy and sustainable choice for your diet.",
    shortDescription: "Nutrient-rich ancient grain, perfect for healthy meals.",
    price: "150.00", 
    comparePrice: "180.00",
    badge: "Organic",
    category: "Grains",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e8c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375761-83865001e8c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1032&q=80"
    ],
    inStock: true,
    stockQuantity: 50,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 364, Protein: 11.5g, Fat: 4g, Carbohydrates: 72g, Fiber: 8g, Iron: 2.8mg, Calcium: 31mg",
    cookingInstructions: "Rinse thoroughly before cooking. Use 1 part millet to 2.5 parts water. Bring to a boil, then simmer for 15-20 minutes until water is absorbed.",
    rating: "4.8",
    reviewCount: 24,
    weightOptions: ["500g", "1kg", "2kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Ananya Sharma", 
        avatar: "https://randomuser.me/api/portraits/women/17.jpg", 
        date: "2023-06-15", 
        rating: 5, 
        comment: "This foxtail millet is amazing! I made a delicious pulao with it and my family loved it. Very nutritious and has a lovely texture.",
        helpfulCount: 8
      },
      {
        id: "2", 
        name: "Ravi Kumar", 
        date: "2023-05-22", 
        rating: 5, 
        comment: "Excellent quality millet. I've been trying to incorporate more ancient grains in my diet, and this is now a staple in my pantry.",
        helpfulCount: 5
      }
    ])
  },
  {
    name: "Barnyard Millet Flour",
    slug: "barnyard-millet-flour",
    description: "Our stone-ground barnyard millet flour is a perfect gluten-free alternative for your baking needs. It has a mild flavor that works well in both sweet and savory recipes. Barnyard millet is known for its high fiber content and low glycemic index, making it an excellent choice for diabetic-friendly cooking.",
    shortDescription: "Gluten-free flour with high fiber content.",
    price: "180.00",
    comparePrice: "200.00",
    badge: "Gluten-Free",
    category: "Flour",
    imageUrl: "https://images.unsplash.com/photo-1586201375800-744e8cf7cdea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375800-744e8cf7cdea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80"
    ],
    inStock: true,
    stockQuantity: 30,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 342, Protein: 10.8g, Fat: 3.9g, Carbohydrates: 65.5g, Fiber: 9.8g, Iron: 3.2mg, Calcium: 28mg",
    cookingInstructions: "Can replace regular flour in most recipes. For bread and baked goods, best results when mixed with other flours at a ratio of 1:3 (1 part millet flour to 3 parts other flours).",
    rating: "4.6",
    reviewCount: 18,
    weightOptions: ["500g", "1kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Priya Patel", 
        avatar: "https://randomuser.me/api/portraits/women/44.jpg", 
        date: "2023-06-02", 
        rating: 5, 
        comment: "I've been looking for gluten-free alternatives for my daughter, and this flour is perfect! Made wonderful dosas and uttapams.",
        helpfulCount: 7
      },
      {
        id: "2", 
        name: "Vikram Singh", 
        date: "2023-05-18", 
        rating: 4, 
        comment: "Good quality flour. I mixed it with whole wheat flour to make rotis and they turned out great. Very nutritious option.",
        helpfulCount: 3
      }
    ])
  },
  {
    name: "Kodo Millet",
    slug: "kodo-millet",
    description: "Kodo millet is an ancient grain that's been cultivated in India for over 3000 years. It's highly nutritious and particularly rich in B vitamins, magnesium, and anti-oxidants. Our kodo millet is sourced from organic farms and carefully processed to maintain its nutritional integrity. It has a light, nutty flavor and cooks up fluffy like rice.",
    shortDescription: "Ancient grain rich in magnesium and B vitamins.",
    price: "140.00",
    comparePrice: "160.00",
    badge: null,
    category: "Grains",
    imageUrl: "https://images.unsplash.com/photo-1586201375896-9b4dcfabf309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375896-9b4dcfabf309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1579032520268-c5e783f35009?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"
    ],
    inStock: true,
    stockQuantity: 45,
    featured: false,
    nutritionFacts: "Serving Size: 100g, Calories: 353, Protein: 8.3g, Fat: 1.4g, Carbohydrates: 65.9g, Fiber: 9g, Iron: 0.5mg, Magnesium: 82mg",
    cookingInstructions: "Rinse before cooking. Use 1 part millet to 3 parts water. Bring to a boil, then simmer covered for 20-25 minutes until tender. Let stand for 5 minutes before fluffing with a fork.",
    rating: "4.5",
    reviewCount: 12,
    weightOptions: ["500g", "1kg", "5kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Deepak Menon", 
        date: "2023-06-10", 
        rating: 4, 
        comment: "Good quality kodo millet. I've been using it in place of rice for dinner and noticed better digestion and energy levels.",
        helpfulCount: 4
      },
      {
        id: "2", 
        name: "Lakshmi Rao", 
        avatar: "https://randomuser.me/api/portraits/women/62.jpg", 
        date: "2023-04-28", 
        rating: 5, 
        comment: "Excellent product! Made millet upma with this and it turned out delicious. The grain quality is very good.",
        helpfulCount: 6
      }
    ])
  },
  {
    name: "Little Millet Rice",
    slug: "little-millet-rice",
    description: "Little millet is a small-grained millet variety that looks similar to rice when cooked. It has a slightly sweet flavor and is incredibly nutritious, containing high amounts of iron, fiber, and essential minerals. Our little millet is perfect for those looking to diversify their grain intake while maintaining a balanced diet.",
    shortDescription: "Rice-like grain with high iron content.",
    price: "160.00",
    comparePrice: null,
    badge: "High Iron",
    category: "Grains",
    imageUrl: "https://images.unsplash.com/photo-1604323990536-89223904101e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1604323990536-89223904101e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 25,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 329, Protein: 7.7g, Fat: 4.7g, Carbohydrates: 67g, Fiber: 7.6g, Iron: 9.3mg, Calcium: 17mg",
    cookingInstructions: "Rinse thoroughly. Use 1 part millet to 2.5 parts water. Bring to a boil, then simmer covered for 15 minutes. Remove from heat and let stand covered for 10 minutes before serving.",
    rating: "4.7",
    reviewCount: 21,
    weightOptions: ["500g", "1kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Arun Kumar", 
        avatar: "https://randomuser.me/api/portraits/men/32.jpg", 
        date: "2023-06-05", 
        rating: 5, 
        comment: "This little millet has become a staple in our household. Great substitute for rice and very filling. Highly recommend!",
        helpfulCount: 9
      },
      {
        id: "2", 
        name: "Meera Nair", 
        date: "2023-05-12", 
        rating: 4, 
        comment: "Very good quality. I make a breakfast porridge with this and it's delicious with some jaggery and nuts.",
        helpfulCount: 5
      }
    ])
  },
  {
    name: "Proso Millet Rava",
    slug: "proso-millet-rava",
    description: "Our proso millet rava is a nutritious alternative to traditional semolina. It's coarsely ground to give the perfect texture for upma, kheer, and other traditional dishes. Proso millet is known for its high protein content and is an excellent source of complex carbohydrates. Try this versatile ingredient to add nutrition and flavor to your cooking.",
    shortDescription: "Coarsely ground millet for traditional dishes.",
    price: "170.00",
    comparePrice: "195.00",
    badge: "High Protein",
    category: "Flour",
    imageUrl: "https://images.unsplash.com/photo-1589419621831-efb1a17c0984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1589419621831-efb1a17c0984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1568822512524-9adc9d114ae1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 35,
    featured: false,
    nutritionFacts: "Serving Size: 100g, Calories: 378, Protein: 12.5g, Fat: 4.2g, Carbohydrates: 69.4g, Fiber: 8.5g, Iron: 3mg, Magnesium: 114mg",
    cookingInstructions: "For upma: Dry roast millet rava until aromatic, set aside. In a pan, add mustard seeds, curry leaves, vegetables, and spices. Add 2.5 cups water per cup of rava, bring to boil, then add the rava. Stir continuously to avoid lumps, cook for 3-5 minutes until done.",
    rating: "4.4",
    reviewCount: 15,
    weightOptions: ["500g", "1kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Rajesh Iyer", 
        date: "2023-05-30", 
        rating: 4, 
        comment: "Made excellent upma with this rava. It has a nice texture and nutty flavor. Will buy again.",
        helpfulCount: 6
      },
      {
        id: "2", 
        name: "Kavita Reddy", 
        avatar: "https://randomuser.me/api/portraits/women/29.jpg", 
        date: "2023-04-15", 
        rating: 5, 
        comment: "I use this to make kheer and it turns out amazing. Much healthier than regular rava and tastes wonderful.",
        helpfulCount: 8
      }
    ])
  },
  {
    name: "Millet Breakfast Cereal",
    slug: "millet-breakfast-cereal",
    description: "Start your day right with our nutrient-packed multi-millet breakfast cereal. This ready-to-cook mix contains a blend of five millets (foxtail, barnyard, kodo, little, and proso), making it a powerhouse of nutrition. Just add water or milk for a quick, wholesome breakfast that keeps you energized throughout the morning.",
    shortDescription: "Five-millet blend for a nutritious breakfast.",
    price: "210.00",
    comparePrice: "250.00",
    badge: "Breakfast",
    category: "Ready to Cook",
    imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80",
      "https://images.unsplash.com/photo-1525373698358-041e3a460346?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"
    ],
    inStock: true,
    stockQuantity: 40,
    featured: true,
    nutritionFacts: "Serving Size: 50g, Calories: 180, Protein: 6g, Fat: 2.5g, Carbohydrates: 35g, Fiber: 4.5g, Iron: 2.4mg, Calcium: 20mg",
    cookingInstructions: "For porridge: Add 1 part cereal to 2 parts water or milk. Bring to a boil, then simmer for 5 minutes, stirring occasionally. Sweeten with jaggery or honey if desired and top with nuts and fresh fruits.",
    rating: "4.9",
    reviewCount: 28,
    weightOptions: ["400g", "800g"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Sanjay Mehta", 
        avatar: "https://randomuser.me/api/portraits/men/57.jpg", 
        date: "2023-06-20", 
        rating: 5, 
        comment: "Best breakfast cereal I've tried! It's filling, nutritious and tastes great. My kids love it too, which is a big win.",
        helpfulCount: 12
      },
      {
        id: "2", 
        name: "Divya Krishnan", 
        date: "2023-05-25", 
        rating: 5, 
        comment: "I've been searching for a healthy breakfast option and this is perfect. I add some banana and honey and it's delicious!",
        helpfulCount: 8
      },
      {
        id: "3", 
        name: "Nikhil Sharma", 
        date: "2023-04-30", 
        rating: 4, 
        comment: "Great product, very convenient for busy mornings. I appreciate that it's not too processed like other breakfast cereals.",
        helpfulCount: 5
      }
    ])
  },
  {
    name: "Millet Cookies",
    slug: "millet-cookies",
    description: "Indulge guilt-free with our delicious millet cookies. Made with a blend of millet flours, jaggery, and cold-pressed oils, these cookies are a healthier alternative to regular wheat-based cookies. They contain no refined sugar, preservatives, or artificial flavors, making them perfect for health-conscious snackers of all ages.",
    shortDescription: "Healthy cookies with no refined sugar.",
    price: "190.00",
    comparePrice: null,
    badge: "No Added Sugar",
    category: "Snacks",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1590080876258-c70c6813e6d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80"
    ],
    inStock: true,
    stockQuantity: 60,
    featured: false,
    nutritionFacts: "Serving Size: 30g (2 cookies), Calories: 130, Protein: 2.5g, Fat: 5g, Carbohydrates: 18g, Fiber: 1.5g, Sugar: 6g",
    cookingInstructions: null,
    rating: "4.6",
    reviewCount: 32,
    weightOptions: ["200g", "400g"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Rohan Desai", 
        date: "2023-06-18", 
        rating: 5, 
        comment: "These cookies are amazing! They satisfy my sweet cravings without the guilt. My kids love them too.",
        helpfulCount: 14
      },
      {
        id: "2", 
        name: "Anjali Mathur", 
        avatar: "https://randomuser.me/api/portraits/women/71.jpg", 
        date: "2023-05-29", 
        rating: 4, 
        comment: "Really good taste and texture. I appreciate that they're not too sweet and have a nutty flavor from the millets.",
        helpfulCount: 9
      }
    ])
  },
  {
    name: "Millet Dosa Mix",
    slug: "millet-dosa-mix",
    description: "Our ready-to-cook millet dosa mix makes preparing this South Indian favorite quick and easy. This nutritious blend contains foxtail millet, urad dal, and spices, all ground to the perfect consistency. Just add water, ferment briefly, and you're ready to make crispy, healthy dosas that are high in protein and fiber while being gluten-free.",
    shortDescription: "Quick, nutritious alternative to traditional dosa.",
    price: "220.00",
    comparePrice: "250.00",
    badge: "Easy Cook",
    category: "Ready to Cook",
    imageUrl: "https://images.unsplash.com/photo-1630383249896-04774c9b5273?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1630383249896-04774c9b5273?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1589648565618-7aa79b979615?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
    ],
    inStock: true,
    stockQuantity: 25,
    featured: false,
    nutritionFacts: "Serving Size: 50g (dry mix), Calories: 175, Protein: 7g, Fat: 1.5g, Carbohydrates: 32g, Fiber: 5g, Iron: 2.1mg",
    cookingInstructions: "Mix 1 cup of dosa mix with 1.5 cups water. Let stand for 30 minutes (or ferment overnight for a tangier taste). Heat a non-stick pan, pour a ladle of batter and spread in circular motions. Drizzle oil around edges, cook until golden, flip and cook other side briefly.",
    rating: "4.5",
    reviewCount: 19,
    weightOptions: ["500g", "1kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Karthik Subramanian", 
        avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
        date: "2023-06-08", 
        rating: 5, 
        comment: "As someone from South India, I was skeptical about a ready mix dosa. But this is excellent! The taste is authentic and preparation is so easy.",
        helpfulCount: 16
      },
      {
        id: "2", 
        name: "Sunita Patel", 
        date: "2023-05-14", 
        rating: 4, 
        comment: "Very convenient and tastes good. The dosas come out crispy and have a nice flavor. Great for busy weekday breakfasts.",
        helpfulCount: 7
      }
    ])
  },
  {
    name: "Pearl Millet Flour",
    slug: "pearl-millet-flour",
    description: "Pearl millet (bajra) flour is a staple in many Indian households, especially in the western regions. Our stone-ground pearl millet flour retains all the nutrients of this amazing grain, which is known for its high protein content and cooling properties. Use it to make traditional rotis, bhakri, or experiment with modern recipes like pancakes and muffins.",
    shortDescription: "Stone-ground flour for traditional rotis.",
    price: "160.00",
    comparePrice: "185.00",
    badge: null,
    category: "Flour",
    imageUrl: "https://images.unsplash.com/photo-1586201375821-2c493c61eec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375821-2c493c61eec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1602094395075-4edcdd10f27f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 40,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 378, Protein: 11.6g, Fat: 5g, Carbohydrates: 67g, Fiber: 11.5g, Iron: 8mg, Calcium: 42mg",
    cookingInstructions: "For rotis: Mix flour with water to form a dough. Divide into small balls, roll out into flat circles. Cook on a hot tawa (griddle) until spots appear, then flip and cook other side. Optional: Place directly on flame for a few seconds to puff up.",
    rating: "4.7",
    reviewCount: 23,
    weightOptions: ["500g", "1kg", "5kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Mahesh Joshi", 
        date: "2023-06-12", 
        rating: 5, 
        comment: "Excellent quality bajra flour. Makes perfect rotis that stay soft even when cold. Very pleased with this purchase.",
        helpfulCount: 11
      },
      {
        id: "2", 
        name: "Radha Gupta", 
        avatar: "https://randomuser.me/api/portraits/women/53.jpg", 
        date: "2023-05-20", 
        rating: 4, 
        comment: "Very good flour. I use it to make theplas with some spices and it turns out delicious every time.",
        helpfulCount: 8
      }
    ])
  },
  {
    name: "Millet Nutrition Bar",
    slug: "millet-nutrition-bar",
    description: "Our millet nutrition bars are the perfect on-the-go snack for busy lifestyles. Each bar contains a blend of millets, nuts, seeds, and natural sweeteners, providing sustained energy and essential nutrients. Free from preservatives, artificial colors, and refined sugar, these bars are a wholesome treat for both adults and children.",
    shortDescription: "Nutritious on-the-go snack with millets and nuts.",
    price: "240.00",
    comparePrice: "280.00",
    badge: "Energy",
    category: "Snacks",
    imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e19d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1630384060421-cb20d0e19d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
      "https://images.unsplash.com/photo-1622484212851-69886479a5de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 75,
    featured: true,
    nutritionFacts: "Serving Size: 40g (1 bar), Calories: 160, Protein: 5g, Fat: 7g, Carbohydrates: 22g, Fiber: 3g, Sugar: 8g",
    cookingInstructions: null,
    rating: "4.8",
    reviewCount: 37,
    weightOptions: ["Box of 6", "Box of 12"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Vivek Malhotra", 
        date: "2023-06-22", 
        rating: 5, 
        comment: "Perfect snack for my trekking trips! These bars are filling, don't melt, and give sustained energy. Plus they taste great!",
        helpfulCount: 15
      },
      {
        id: "2", 
        name: "Neha Singhania", 
        avatar: "https://randomuser.me/api/portraits/women/9.jpg", 
        date: "2023-06-05", 
        rating: 5, 
        comment: "I keep these in my office drawer for healthy snacking. Love that they're not overly sweet and actually fill me up.",
        helpfulCount: 12
      },
      {
        id: "3", 
        name: "Ajay Prabhu", 
        date: "2023-05-17", 
        rating: 4, 
        comment: "Good taste and healthy ingredients. My kids enjoy them as after-school snacks. Will definitely buy again.",
        helpfulCount: 8
      }
    ])
  }
];