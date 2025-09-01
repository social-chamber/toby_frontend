// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     // Disable optimization to ensure all images render immediately in production
//     // This bypasses remote host restrictions of the Next.js image optimizer
//     unoptimized: true,
//     domains: ["www.drupal.org", "encrypted-tbn0.gstatic.com"],
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "res.cloudinary.com",
//       },
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//       },
//     ],
//   },
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable optimization to ensure all images render immediately in production
    // This bypasses remote host restrictions of the Next.js image optimizer
    unoptimized: true,
    domains: [
      "www.drupal.org",
      "encrypted-tbn0.gstatic.com",
      "api.thesocialchamber.com" // backend API host serving /uploads
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.thesocialchamber.com", // prod API for /uploads/*
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5003", // dev API for /uploads/*
      },
    ],
  },
};

export default nextConfig;