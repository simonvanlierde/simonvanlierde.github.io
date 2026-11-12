import citation from "../../CITATION.cff?raw";

export function GET() {
  return new Response(citation, { headers: { "Content-Type": "application/yaml; charset=utf-8" } });
}
