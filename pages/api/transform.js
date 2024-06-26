// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Helper function to perform the calculation
function calculateProductQuantity(data) {
  let totalSum = 0;
  const transformedData = data.map((itemList) => {
    const quantityIndex = itemList.findIndex(
      (item) => item.key === "667c2b211d399"
    );
    const priceIndex = itemList.findIndex(
      (item) => item.key === "667c2b211d39a"
    );
    const productIndex = itemList.findIndex(
      (item) => item.key === "667c2b211d39b"
    );

    if (quantityIndex !== -1 && priceIndex !== -1 && productIndex !== -1) {
      const quantityValue = itemList[quantityIndex].value;
      const quantity = parseFloat(quantityValue.split(" ")[0]);
      const price = parseFloat(itemList[priceIndex].value);
      const product = quantity * price;

      itemList[productIndex].value = product.toFixed(2);
      totalSum += product;
    }

    return itemList;
  });

  return { transformedData, totalSum: totalSum.toFixed(2) };
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const {
        id,
        cf_item_list_poreq,
        cf_shipping_n_handling_c,
        cf_tax_c,
        cf_others_c,
        cf_po_type,
      } = JSON.parse(req.body);

      const { transformedData, totalSum } = calculateProductQuantity(
        JSON.parse(cf_item_list_poreq)
      );

      const subtotal = parseFloat(totalSum);
      const shipping = parseFloat(cf_shipping_n_handling_c || 0);
      const tax = parseFloat(cf_tax_c || 0);
      const others = parseFloat(cf_others_c || 0);

      let total = subtotal + shipping + tax + others;
      if (cf_po_type === "External") {
        total *= 1.15;
      }

      console.log(total);

      const body = {
        data: {
          type: "records",
          id: id,
          attributes: {
            cf_item_list_poreq: transformedData,
            cf_subtotal_n: subtotal.toFixed(2),
            cf_total: total.toFixed(2),
          },
        },
      };

      // console.log(JSON.stringify(body, null, 2)); // Pretty print the entire body

      var myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${process.env.ACCESS_TOKEN}`);
      myHeaders.append("Content-Type", "application/json");

      var requestOptions = {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: myHeaders,
        redirect: "follow",
      };

      const response = await fetch(
        `${process.env.ENDPOINT_DOMAIN}/records/${id}`,
        requestOptions
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Request failed with status: ${response.status}`);
        console.error(`Response body:`, errorText);
        return res.status(response.status).json({
          error: `Request failed with status: ${response.status}`,
          details: errorText,
        });
      }

      const responseBody = {
        message: "Webhook event received successfully",
      };
      res.status(200);
      res.json(responseBody);
    } catch (error) {
      console.error("Error handling webhook event:", error);

      // Log more details about the error, including the response body
      if (error.response) {
        const responseBody = await error.response.text();
        console.error("Response body:", responseBody);
      }

      res.status(500);
    }
  } else if (req.method === "GET") {
    const data = { message: "Hello, World!" };
    res.json(data);
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
