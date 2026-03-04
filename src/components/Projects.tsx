"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FiGithub, FiExternalLink } from "react-icons/fi";

const projects = [
  {
    title: "E-Commerce Platform",
    description:
      "Next.js ve Stripe ile geliştirilmiş tam özellikli e-ticaret platformu. Ürün yönetimi, sepet ve ödeme sistemi içerir.",
    tags: ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Tailwind"],
    github: "https://github.com",
    demo: "https://example.com",
    gradient: "from-indigo-600 to-blue-600",
  },
  {
    title: "Task Manager App",
    description:
      "React ve Node.js ile yapılmış gerçek zamanlı görev yönetim uygulaması. WebSocket ile anlık güncellemeler.",
    tags: ["React", "Node.js", "Socket.io", "MongoDB", "Redis"],
    github: "https://github.com",
    demo: "https://example.com",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    title: "AI Blog Generator",
    description:
      "OpenAI API kullanarak otomatik blog yazısı oluşturan platform. SEO optimizasyonu ve otomatik yayınlama özelliği.",
    tags: ["Next.js", "OpenAI", "Prisma", "Vercel", "TypeScript"],
    github: "https://github.com",
    demo: "https://example.com",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    title: "Portfolio Website",
    description:
      "Next.js, Tailwind CSS ve Framer Motion ile geliştirilen bu portfolyo sitesi. Railway üzerinde deploy edildi.",
    tags: ["Next.js", "Framer Motion", "Tailwind", "Railway"],
    github: "https://github.com",
    demo: "https://example.com",
    gradient: "from-orange-600 to-red-600",
  },
];

export default function Projects() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="projects" className="py-24 px-6 bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-indigo-400 font-medium uppercase tracking-widest text-sm mb-2">
            Projeler
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">
            Son Çalışmalarım
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-800/80 transition-colors"
            >
              <div className={`h-2 w-full bg-gradient-to-r ${project.gradient}`} />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs rounded-full bg-gray-800 text-gray-300 border border-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <FiGithub size={16} />
                    Kod
                  </a>
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <FiExternalLink size={16} />
                    Demo
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
