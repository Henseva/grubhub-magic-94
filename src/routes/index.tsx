import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const App = lazy(() => import("../App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mercado Fresco | Hortifruti fresco todo dia" },
      {
        name: "description",
        content:
          "Loja online de hortifruti fresco com pedidos por encomenda, kits semanais, frutas picadas e entrega rápida.",
      },
      { property: "og:title", content: "Mercado Fresco | Hortifruti fresco todo dia" },
      {
        property: "og:description",
        content:
          "Loja online de hortifruti fresco com pedidos por encomenda, kits semanais, frutas picadas e entrega rápida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
