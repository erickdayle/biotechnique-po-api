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
      const { id, cf_po_item_list_multiple } = JSON.parse(req.body);
      const { transformedData, totalSum } = calculateProductQuantity(
        JSON.parse(cf_po_item_list_multiple)
      );

      const body = {
        data: {
          type: "records",
          id: id,
          attributes: {
            cf_po_item_list_multiple: transformedData,
            cf_subtotal_n: totalSum,
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

      if (response.ok) {
        // Request was successful (status code in the range 200-299)
        const result = await response.text();
      } else {
        // Request failed, handle the error
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
      responseBody = { error: "Internal Server Error" };
    }
  } else if (req.method === "GET") {
    const data = { message: "Hello, World!" };
    res.json(data);
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}