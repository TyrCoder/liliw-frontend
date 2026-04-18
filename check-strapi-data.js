const axios = require('axios');

const token = '46061e8f19cec5028f41c9e08fa6875dca8a6a9e27a01201827457e584cad947f64f1be5ad420f6631fac2a20e5ba72001b36f6ba05a2a859e5b10d5afefc808c0478ce76bfcf234a9353d04ea775fc573ba55c5dfc5189c20c12e92325e8b4ee3a7d13660fe45a97ed42da571d37634e2571c6968a6b16c926b12108d92d7f7';

const collections = ['faqs', 'events', 'contact-info', 'categories'];

Promise.all(
  collections.map(col => 
    axios.get(`http://localhost:1337/api/${col}?populate=*`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => ({ data: { data: [] }, error: e.message }))
  )
).then(responses => {
  responses.forEach((res, idx) => {
    const count = res.data?.data?.length || 0;
    console.log(`${collections[idx]}: ${count} items`);
    if (count > 0) {
      console.log(JSON.stringify(res.data.data.slice(0, 1), null, 2));
    }
  });
}).catch(e => console.error(e.message));
