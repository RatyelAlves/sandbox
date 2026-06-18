import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cabanasenhoradagloria.com.br" },
      { protocol: "https", hostname: "ccpjo.org.br" },
      { protocol: "https", hostname: "nucleovidabh.com.br" },
      { protocol: "https", hostname: "maghabh.com" },
      { protocol: "https", hostname: "templodeumbandahermetica.org.br" },
      { protocol: "https", hostname: "assets.zyrosite.com" },
      { protocol: "https", hostname: "cdn.zyrosite.com" },
      { protocol: "https", hostname: "portal.contagem.mg.gov.br" },
      { protocol: "https", hostname: "www.terreirosdobrasil.com.br" },
      { protocol: "https", hostname: "pacs.org.br" },
      { protocol: "https", hostname: "www.cedefes.org.br" },
      { protocol: "http", hostname: "kilombomanzo.weebly.com" },
      { protocol: "http", hostname: "1.bp.blogspot.com" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "s0.wp.com" },
    ],
  },
};

export default nextConfig;
