import * as THREE from './node_modules/three/build/three.module.min.js';

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const initWebGL = () => {
  const canvas = document.getElementById("webgl-canvas");
  if (!canvas || typeof THREE === "undefined") {
    document.body.classList.add("no-webgl");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    document.body.classList.add("no-webgl");
    return;
  }

  document.body.classList.add("webgl-ready");
  document.body.classList.remove("webgl-loading");

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  if (renderer.outputColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeaf4f2, 6, 42);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    140
  );
  camera.position.set(0, 0, 8);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(6, 8, 10);
  const rimLight = new THREE.PointLight(0x1fb6b0, 1.2, 30);
  rimLight.position.set(-6, -4, 8);
  const warmLight = new THREE.PointLight(0xf5b25d, 0.9, 24);
  warmLight.position.set(4, 2, 6);

  scene.add(ambient, keyLight, rimLight, warmLight);

  const root = new THREE.Group();
  scene.add(root);

  const materials = {
    teal: new THREE.MeshStandardMaterial({
      color: 0x1fb6b0,
      metalness: 0.25,
      roughness: 0.2,
      emissive: 0x0b4f4d,
      emissiveIntensity: 0.35,
    }),
    sun: new THREE.MeshStandardMaterial({
      color: 0xf5b25d,
      metalness: 0.15,
      roughness: 0.3,
      emissive: 0x8a5b18,
      emissiveIntensity: 0.25,
    }),
    ink: new THREE.MeshStandardMaterial({
      color: 0x0c1b2a,
      metalness: 0.25,
      roughness: 0.4,
      emissive: 0x050b12,
      emissiveIntensity: 0.18,
    }),
    mint: new THREE.MeshStandardMaterial({
      color: 0xd8f3ea,
      metalness: 0.1,
      roughness: 0.4,
      emissive: 0x3b786a,
      emissiveIntensity: 0.2,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.4,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6,
    }),
  };

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x9ff0ea,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x7cdad6,
    transparent: true,
    opacity: 0.6,
  });

  const spinners = [];
  const runners = [];

  const addSpinner = (mesh, speed) => {
    spinners.push({ mesh, speed });
  };

  const createRing = (radius, tube, material) => {
    return new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 16, 120),
      material
    );
  };

  const createHelix = (radius, height, turns, material) => {
    const points = [];
    const segments = 90;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          t * height - height / 2,
          Math.sin(angle) * radius
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 160, 0.06, 12, false);
    const mesh = new THREE.Mesh(geometry, material);
    return { mesh, curve };
  };

  const createSectionGroup = (type, index) => {
    const group = new THREE.Group();

    switch (type) {
      case "hero": {
        const core = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.3, 1),
          materials.teal
        );
        const wire = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.55, 1),
          wireMaterial
        );
        const ring = createRing(2.05, 0.05, materials.sun);
        ring.rotation.x = Math.PI / 2.6;
        group.add(core, wire, ring);
        addSpinner(core, { x: 0.002, y: 0.003, z: 0.001 });
        addSpinner(ring, { x: -0.001, y: 0.002, z: 0.001 });
        break;
      }
      case "marquee": {
        const ring = createRing(1.5, 0.03, materials.mint);
        ring.rotation.y = Math.PI / 2;
        group.add(ring);
        addSpinner(ring, { x: 0.0015, y: 0.001, z: 0 });
        break;
      }
      case "programs": {
        const positions = [
          new THREE.Vector3(-1.2, 0.6, 0),
          new THREE.Vector3(1.1, 0.4, 0.4),
          new THREE.Vector3(0, -0.9, -0.6),
        ];
        const materialsList = [materials.teal, materials.sun, materials.mint];
        positions.forEach((pos, i) => {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 26, 26),
            materialsList[i]
          );
          sphere.position.copy(pos);
          group.add(sphere);
          addSpinner(sphere, { x: 0.002, y: 0.0015, z: 0.001 });
        });
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([...positions, positions[0]]),
          lineMaterial
        );
        group.add(line);
        break;
      }
      case "story": {
        const plateGeo = new THREE.BoxGeometry(1.6, 0.95, 0.08);
        const plateA = new THREE.Mesh(plateGeo, materials.glass);
        const plateB = new THREE.Mesh(plateGeo, materials.glass);
        const plateC = new THREE.Mesh(plateGeo, materials.glass);
        plateA.position.set(0, 0.5, 0);
        plateB.position.set(0.2, -0.05, 0.3);
        plateB.rotation.y = 0.3;
        plateC.position.set(-0.25, -0.55, -0.2);
        plateC.rotation.y = -0.2;
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 24, 24),
          materials.teal
        );
        orb.position.set(-0.6, -0.2, 0.6);
        group.add(plateA, plateB, plateC, orb);
        addSpinner(orb, { x: 0.002, y: 0.002, z: 0.001 });
        break;
      }
      case "pipeline": {
        const helixGroup = new THREE.Group();
        const { mesh, curve } = createHelix(1.1, 3.3, 3.5, materials.glass);
        helixGroup.add(mesh);
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          materials.sun
        );
        helixGroup.add(dot);
        helixGroup.rotation.z = Math.PI / 6;
        group.add(helixGroup);
        runners.push({ curve, mesh: dot, speed: 0.08, offset: Math.random() });
        addSpinner(helixGroup, { x: 0.001, y: 0.0015, z: 0.001 });
        break;
      }
      case "values": {
        const ringA = createRing(1.2, 0.04, materials.teal);
        const ringB = createRing(1.6, 0.04, materials.mint);
        const ringC = createRing(2.0, 0.04, materials.sun);
        ringA.rotation.x = Math.PI / 2;
        ringB.rotation.x = Math.PI / 2.5;
        ringC.rotation.y = Math.PI / 3;
        group.add(ringA, ringB, ringC);
        addSpinner(ringA, { x: 0.002, y: 0.001, z: 0.001 });
        addSpinner(ringB, { x: -0.001, y: 0.0015, z: 0 });
        break;
      }
      case "stakeholders": {
        const positions = [
          new THREE.Vector3(-1, 0.7, 0),
          new THREE.Vector3(1, 0.7, 0.2),
          new THREE.Vector3(-1, -0.7, -0.2),
          new THREE.Vector3(1, -0.7, 0),
        ];
        positions.forEach((pos) => {
          const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 20, 20),
            materials.mint
          );
          node.position.copy(pos);
          group.add(node);
        });
        const line = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            positions[0],
            positions[1],
            positions[1],
            positions[3],
            positions[3],
            positions[2],
            positions[2],
            positions[0],
          ]),
          lineMaterial
        );
        group.add(line);
        break;
      }
      case "platforms": {
        const cubeGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        for (let x = -2; x <= 2; x += 1) {
          for (let y = -1; y <= 1; y += 1) {
            const cube = new THREE.Mesh(
              cubeGeo,
              x % 2 === 0 ? materials.teal : materials.glass
            );
            cube.position.set(x * 0.4, y * 0.5, (x + y) * 0.12);
            group.add(cube);
          }
        }
        addSpinner(group, { x: 0.001, y: 0.001, z: 0 });
        break;
      }
      case "testimonials": {
        const knot = new THREE.Mesh(
          new THREE.TorusKnotGeometry(1, 0.25, 140, 16),
          materials.teal
        );
        const halo = createRing(1.8, 0.03, materials.mint);
        halo.rotation.x = Math.PI / 2.4;
        group.add(knot, halo);
        addSpinner(knot, { x: 0.002, y: 0.002, z: 0.001 });
        break;
      }
      case "awards": {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.6, 1.4, 8),
          materials.sun
        );
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 0.2, 18),
          materials.ink
        );
        base.position.y = -0.9;
        group.add(cone, base);
        addSpinner(cone, { x: 0.0015, y: 0.002, z: 0.001 });
        break;
      }
      case "process": {
        const flowGroup = new THREE.Group();
        const { mesh, curve } = createHelix(1.0, 3.0, 2.2, materials.mint);
        flowGroup.add(mesh);
        const runner = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          materials.sun
        );
        flowGroup.add(runner);
        flowGroup.rotation.x = Math.PI / 4;
        group.add(flowGroup);
        runners.push({ curve, mesh: runner, speed: 0.05, offset: 0.2 });
        break;
      }
      case "insights": {
        const planeGeo = new THREE.PlaneGeometry(1.6, 1);
        const cardA = new THREE.Mesh(planeGeo, materials.glass);
        const cardB = new THREE.Mesh(planeGeo, materials.glass);
        const cardC = new THREE.Mesh(planeGeo, materials.glass);
        cardA.position.set(-0.6, 0.5, 0);
        cardB.position.set(0.6, 0.1, 0.2);
        cardC.position.set(-0.2, -0.6, -0.2);
        cardA.rotation.y = -0.2;
        cardB.rotation.y = 0.25;
        cardC.rotation.y = -0.1;
        group.add(cardA, cardB, cardC);
        addSpinner(group, { x: 0.001, y: 0.0012, z: 0.0008 });
        break;
      }
      case "contact": {
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 32, 32),
          materials.teal
        );
        const ring = createRing(1.9, 0.05, materials.sun);
        ring.rotation.x = Math.PI / 2;
        group.add(core, ring);
        addSpinner(core, { x: 0.0015, y: 0.002, z: 0.001 });
        break;
      }
      default: {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 22, 22),
          materials.mint
        );
        group.add(sphere);
        addSpinner(sphere, { x: 0.001, y: 0.001, z: 0.001 });
      }
    }

    return group;
  };

  const sectionElements = Array.from(document.querySelectorAll("main section"));
  const sectionGap = 6;
  const sectionGroups = [];

  sectionElements.forEach((section, index) => {
    const type = section.getAttribute("data-scene") || "default";
    const group = createSectionGroup(type, index);
    const baseX = index % 2 === 0 ? -1.4 : 1.4;
    const baseZ = -index * 0.15;
    group.position.set(baseX, -index * sectionGap, baseZ);
    root.add(group);
    sectionGroups.push({ group, baseX, baseZ });
  });

  const totalHeight = Math.max(1, (sectionGroups.length - 1) * sectionGap);

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 320;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 10;
    starPositions[i * 3 + 1] = -Math.random() * totalHeight + 1;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3)
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xbfe9e4,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
    })
  );
  root.add(stars);

  let scrollProgress = 0;
  const updateScroll = () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  };
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  const pointer = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  };
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  const motion = prefersReducedMotion ? 0 : 1;

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    const targetY = -scrollProgress * totalHeight;
    const ease = prefersReducedMotion ? 1 : 0.08;

    camera.position.y += (targetY - camera.position.y) * ease;
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.05;
    camera.position.z += (8 + pointer.y * 0.4 - camera.position.z) * 0.05;
    camera.lookAt(0, camera.position.y, 0);

    if (motion) {
      sectionGroups.forEach((item, index) => {
        item.group.rotation.y += 0.001 + index * 0.00015;
        item.group.rotation.x = Math.sin(elapsed * 0.4 + index) * 0.08;
        item.group.position.x =
          item.baseX + Math.sin(elapsed * 0.3 + index) * 0.12;
        item.group.position.z =
          item.baseZ + Math.cos(elapsed * 0.25 + index) * 0.1;
      });

      spinners.forEach((spinner) => {
        spinner.mesh.rotation.x += spinner.speed.x;
        spinner.mesh.rotation.y += spinner.speed.y;
        spinner.mesh.rotation.z += spinner.speed.z;
      });

      runners.forEach((runner) => {
        const t = (elapsed * runner.speed + runner.offset) % 1;
        const point = runner.curve.getPointAt(t);
        runner.mesh.position.copy(point);
      });

      stars.rotation.y += 0.0004;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
};

initWebGL();

const header = document.querySelector(".site-header");
const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 8);
};
window.addEventListener("scroll", updateHeader);
updateHeader();

const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("nav-panel");

const closeNav = () => {
  document.body.classList.remove("nav-open");
  if (navToggle) navToggle.setAttribute("aria-expanded", "false");
};

if (navToggle && navPanel) {
  navToggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    const isInside = navPanel.contains(event.target) || navToggle.contains(event.target);
    if (!isInside) closeNav();
  });
}

const megaTriggers = document.querySelectorAll(".mega-trigger");
const closeMegas = () => megaTriggers.forEach((btn) => btn.setAttribute("aria-expanded", "false"));

megaTriggers.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const expanded = btn.getAttribute("aria-expanded") === "true";
    closeMegas();
    if (!expanded) btn.setAttribute("aria-expanded", "true");
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".has-mega")) return;
  closeMegas();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
    closeMegas();
  }
});

const revealElements = document.querySelectorAll(".reveal");
if (prefersReducedMotion) {
  revealElements.forEach((el) => el.classList.add("in-view"));
} else if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("in-view"));
}

const counters = document.querySelectorAll("[data-count]");
const animateCount = (el) => {
  const target = Number(el.getAttribute("data-count"));
  const duration = 1200;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value.toString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toString();
  };
  requestAnimationFrame(step);
};

if (prefersReducedMotion) {
  counters.forEach((el) => (el.textContent = el.getAttribute("data-count")));
} else if ("IntersectionObserver" in window) {
  const countObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (!el.dataset.counted) {
            animateCount(el);
            el.dataset.counted = "true";
          }
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countObserver.observe(el));
} else {
  counters.forEach((el) => (el.textContent = el.getAttribute("data-count")));
}

const testimonials = Array.from(document.querySelectorAll(".testimonial"));
const prevBtn = document.querySelector("[data-testimonial-prev]");
const nextBtn = document.querySelector("[data-testimonial-next]");
let testimonialIndex = 0;

const showTestimonial = (index) => {
  testimonials.forEach((item, i) => {
    const active = i === index;
    item.classList.toggle("active", active);
    item.setAttribute("aria-hidden", active ? "false" : "true");
  });
};

const nextTestimonial = () => {
  testimonialIndex = (testimonialIndex + 1) % testimonials.length;
  showTestimonial(testimonialIndex);
};

const prevTestimonial = () => {
  testimonialIndex = (testimonialIndex - 1 + testimonials.length) % testimonials.length;
  showTestimonial(testimonialIndex);
};

if (testimonials.length) showTestimonial(0);
if (nextBtn) nextBtn.addEventListener("click", nextTestimonial);
if (prevBtn) prevBtn.addEventListener("click", prevTestimonial);

let testimonialTimer;
if (!prefersReducedMotion && testimonials.length > 1) {
  testimonialTimer = setInterval(nextTestimonial, 8000);
}

const testimonialWrap = document.querySelector(".testimonial-wrap");
if (testimonialWrap && testimonialTimer) {
  testimonialWrap.addEventListener("mouseenter", () => clearInterval(testimonialTimer));
  testimonialWrap.addEventListener("mouseleave", () => {
    testimonialTimer = setInterval(nextTestimonial, 8000);
  });
}

const awardsList = document.querySelector(".awards-list");
const awardsToggle = document.querySelector("[data-awards-toggle]");
if (awardsList && awardsToggle) {
  awardsToggle.addEventListener("click", () => {
    const expanded = awardsToggle.getAttribute("aria-expanded") === "true";
    awardsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    awardsToggle.textContent = expanded ? "View More" : "View Less";
    awardsList.classList.toggle("expanded", !expanded);
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();



const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const status = contactForm.querySelector(".form-status");
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (status) {
      status.className = "form-status";
      status.textContent = "Sending...";
    }
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }
      contactForm.reset();
      if (status) {
        status.className = "form-status ok";
        status.textContent = "Thanks! We will get back to you soon.";
      }
    } catch (error) {
      if (status) {
        status.className = "form-status error";
        status.textContent = error.message || "Something went wrong.";
      }
    }
  });
}
