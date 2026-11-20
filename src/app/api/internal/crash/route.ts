// Demo-only endpoint: crashes the server on purpose so monitoring agents
// have a real outage (and a real error in the logs) to detect.
// Returns 404 unless the request carries the secret CRASH_TOKEN.

export async function POST(req: Request) {
  const token = process.env.CRASH_TOKEN;
  if (!token || req.headers.get("x-crash-token") !== token) {
    return new Response(null, { status: 404 });
  }

  setTimeout(() => {
    console.error(
      new Error(
        "FineService: loan.dueDate is null while settling fines (loanId ML-BK06-C01)",
      ),
    );
    process.exit(1);
  }, 100);

  return new Response(null, { status: 202 });
}
