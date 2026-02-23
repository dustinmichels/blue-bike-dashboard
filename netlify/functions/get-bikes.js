export default async (req, context) => {
  const body = await req.json();

  const response = await fetch(
    "https://account.bluebikes.com/bikesharefe-gql",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};
