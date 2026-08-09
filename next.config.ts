import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/inbox",
        destination: "/workspace?tab=inbox",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/workspace?tab=projects",
        permanent: true,
      },
      {
        source: "/tasks",
        destination: "/workspace?tab=projects",
        permanent: true,
      },
      {
        source: "/projects/:id",
        destination: "/workspace?tab=projects&project=:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
