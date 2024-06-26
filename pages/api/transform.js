// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Helper function to perform the calculation
function calculateProductQuantity(data) {
  let totalSum = 0;
  const transformedData = data.map((itemList) => {
    const quantityIndex = itemList.findIndex(
      (item) => item.key === "663b950f50384"
    );
    const priceIndex = itemList.findIndex(
      (item) => item.key === "663b950f50385"
    );
    const productIndex = itemList.findIndex(
      (item) => item.key === "663b950f50386"
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
        cf_po_item_list_multiple,
        cf_shipping_n_handling_c,
        cf_tax_c,
        cf_others_c,
        cf_po_type,
      } = JSON.parse(req.body);
      const { transformedData, totalSum } = calculateProductQuantity(
        JSON.parse(cf_po_item_list_multiple)
      );

      let total = 0;

      if (cf_po_type === "External") {
        total = (
          (parseFloat(totalSum) +
            parseFloat(cf_shipping_n_handling_c || 0) +
            parseFloat(cf_tax_c || 0) +
            parseFloat(cf_others_c || 0)) *
          1.15
        ).toFixed(2);
      } else {
        total = (
          parseFloat(totalSum) +
          parseFloat(cf_shipping_n_handling_c || 0) +
          parseFloat(cf_tax_c || 0) +
          parseFloat(cf_others_c || 0)
        ).toFixed(2);
      }

      const body = {
        data: {
          type: "records",
          id: id,
          attributes: {
            cf_po_item_list_multiple: transformedData,
            cf_subtotal_n: totalSum,
            cf_total_ca: total,
          },
        },
      };

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
        throw new Error(`Request failed with status: ${response.status}`);
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
