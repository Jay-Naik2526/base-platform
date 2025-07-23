import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- FAQ Item Component ---
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="faq-question w-full flex justify-between items-center text-left py-4 px-2 hover:bg-slate-800"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div className={`faq-answer ${isOpen ? 'open p-4' : ''}`}>
        <p className="text-gray-400">{answer}</p>
      </div>
    </div>
  );
};

function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // This ensures that AOS is initialized after the initial page elements are mounted
    setTimeout(() => {
      if (window.AOS) {
        window.AOS.init({ duration: 1000, once: true });
      }
    }, 100);

    // This will refresh AOS after a short delay, ensuring it sees all images and content
    const refreshAos = setTimeout(() => {
      if (window.AOS) {
        window.AOS.refresh();
      }
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(refreshAos);
    }
  }, []);

  return (
    <div className="bg-slate-900 text-white">
      {/* Background Video Section */}
      <div className="fixed inset-0 w-full h-screen z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="/videos/background.mp4"
        />
        <div className="absolute inset-0 bg-slate-900 opacity-70" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <header className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 border-b ${isScrolled ? 'navbar-scrolled border-slate-700' : 'border-transparent'}`}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
            <img src="/images/Adobe Express - file 1.png" alt="BASE Logo" className="h-10 w-auto" />
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#programs" className="hover:text-white transition-colors">Programs</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 text-sm">
              Student Portal
            </Link>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col justify-center items-center text-center">
            <div className={`bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-8 md:p-12 transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <h1 className={`text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight transition-all duration-1000 ease-out animate-delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                Igniting Scientific Curiosity.
              </h1>
              <p className={`text-lg md:text-xl text-gray-300 mt-6 max-w-2xl transition-all duration-1000 ease-out animate-delay-400 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                BASE is where complex concepts become clear, and students transform into scholars.
              </p>
              <div className={`mt-10 transition-all duration-1000 ease-out animate-delay-500 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <a href="#features" className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-4 px-10 rounded-lg text-lg transition duration-300">
                  Discover More
                </a>
              </div>
            </div>
          </section>

          {/* Features Section with Icons */}
          <section id="features" className="py-24">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl font-bold">The BASE Advantage</h2>
              <p className="text-lg text-gray-400 mt-4">More than a tuition, it's a transformation.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center" data-aos="fade-up" data-aos-delay="100">
                <div className="flex justify-center items-center mb-6 h-16 w-16 rounded-full bg-blue-500/20 mx-auto">
                  <svg className="h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Proven Results</h3>
                <p className="text-gray-400">15+ years of consistently producing A1 scorers and city toppers.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center" data-aos="fade-up" data-aos-delay="200">
                <div className="flex justify-center items-center mb-6 h-16 w-16 rounded-full bg-blue-500/20 mx-auto">
                  <svg className="h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Concept Clarity</h3>
                <p className="text-gray-400">We focus on deep understanding, not just memorization.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center" data-aos="fade-up" data-aos-delay="300">
                <div className="flex justify-center items-center mb-6 h-16 w-16 rounded-full bg-blue-500/20 mx-auto">
                  <svg className="h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Personal Attention</h3>
                <p className="text-gray-400">Our small batch sizes ensure every student gets the focus they deserve.</p>
              </div>
            </div>
          </section>

          {/* Programs Section */}
          <section id="programs" className="py-24">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl font-bold">Our Programs</h2>
              <p className="text-lg text-gray-400 mt-4">Focused curriculum for foundational and advanced science.</p>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-right">
                <h3 className="text-2xl font-semibold mb-4 text-white">Science (7th to 10th)</h3>
                <p className="text-gray-400">Building a rock-solid foundation in Physics, Chemistry, and Biology to excel in school exams and prepare for future competitive challenges.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-left" data-aos-delay="100">
                <h3 className="text-2xl font-semibold mb-4 text-white">Biology (11th & 12th)</h3>
                <p className="text-gray-400">An in-depth and specialized focus on Biology, designed to help students master the subject for board exams and medical entrance tests like NEET.</p>
              </div>
            </div>
          </section>

          {/* --- UPDATED --- "Meet the Founder" Section */}
          <section id="about" className="py-24 grid md:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <img src="/images/WhatsApp Image 2025-07-20 at 11.29.23.jpeg" alt="Dhana Ma'am" className="rounded-lg shadow-2xl w-full max-w-md mx-auto" />
            </div>
            <div data-aos="fade-left" data-aos-delay="200">
              <h2 className="text-4xl font-bold mb-4">Meet Dhaneshwari Ma’am</h2>
              <div className="text-lg text-gray-400 space-y-4">
                <p>With over a decade of unwavering dedication to teaching, Dhaneshwari Ma’am stands as the heart and soul behind Study at Base. Her teaching philosophy blends deep subject knowledge with empathy, discipline, and a sharp understanding of how young minds think and grow.</p>
                <p>A true believer in clarity over complexity, she has helped hundreds of students build strong foundations in Physics, Chemistry, and Biology, not just for exams, but for life.</p>
                <p>Now with the launch of BASE, she brings this same spirit of excellence to a modern, tech-powered platform, where discipline meets digital and learning becomes not just effective, but enjoyable.</p>
              </div>
              <p className="text-xl text-gray-300 mt-6 italic">“I don’t just want students to score marks. I want them to develop a mindset that can take on any challenge, academic or otherwise.”</p>
            </div>
          </section>

          {/* --- UPDATED --- Testimonials Section */}
          <section id="testimonials" className="py-24">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl font-bold">What Our Students Say</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-up">
                <p className="text-lg text-gray-300 italic">"I used to score around 60% before I started learning from Dhana ma’am. Her clear teaching, regular tests, and structured study plan helped me understand concepts better and stay disciplined. With her guidance and motivation, I was able to cross 90% in my 10th boards. I’m truly grateful for her support and highly recommend her to anyone looking for a great teacher."</p>
                <p className="text-right mt-4 font-semibold text-white">- Aayush Chauhan</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-up" data-aos-delay="100">
                <p className="text-lg text-gray-300 italic">"Hey ma'am !! I loved the way you taught us concepts again and again until we fully feel and understand it , gave us a lot of practice , practice which actually mattered and helped us so much in the exams !! You not only taught us the subject but also gave us tips and tricks from time to time to easily remember and recall the concepts !! You also guided in life by showing us what actually mattered and what didn't which has helped me so much to this day and would never forget that !!"</p>
                <p className="text-right mt-4 font-semibold text-white">- Jash Vora</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-up" data-aos-delay="200">
                <p className="text-lg text-gray-300 italic">"My experience at BASE was amazing... My 10th std was just after the COVID period so I didn't study much in my 9th and was scared about my 10th std but it was too early for me to say this. As soon as I joined Dhaneshwari ma'am's BASE, everything started getting back on the track. Ma'am did some miracle and developed interest in Science..."</p>
                <p className="text-right mt-4 font-semibold text-white">- Nityam</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700" data-aos="fade-up" data-aos-delay="300">
                <p className="text-lg text-gray-300 italic">"I was one of the students who hated science just because I can't do it until I joined this tuition class. Well and detailed explanation while having fun with friends and teachers , revision before exams helped me get a 94 in science in 10th. Thank you so much for that btw ♥️"</p>
                <p className="text-right mt-4 font-semibold text-white">- Pratham Prajapati</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-24">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto bg-slate-800/50 p-4 rounded-lg border border-slate-700" data-aos="zoom-in-up">
              <FaqItem
                question="What subjects and grades do you teach?"
                answer="We specialize in Science for 7th to 10th grade and Biology for 11th & 12th grade. Our curriculum is designed to build a strong foundation for competitive exams and future studies."
              />
              <FaqItem
                question="What is the batch size?"
                answer="We believe in personalized attention. Our batches are intentionally kept small to ensure every student can interact with the teacher and get their doubts cleared effectively."
              />
              <FaqItem
                question="How do you track student progress?"
                answer="We conduct regular tests and assessments. All marks, attendance, and feedback are updated on this student portal, which parents can access 24/7 to monitor their child's performance."
              />
              <FaqItem
                question="Do you provide study materials?"
                answer="Yes, we provide comprehensive, chapter-wise notes and other study materials. These are shared through the Resource Hub on the student and parent dashboards."
              />
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-24 text-center">
            <div data-aos="fade-up">
              <h2 className="text-4xl font-bold">Ready to Join?</h2>
              <p className="text-lg text-gray-400 mt-4 mb-8">Contact us to enroll or to learn more about our programs.</p>
              <p className="text-xl text-white font-semibold">Email: info@studyatbase.in</p>
              <p className="text-xl text-white font-semibold mt-2">Phone: +91 9408294027</p>
            </div>
          </section>

          <footer className="text-center py-8 border-t border-slate-800">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} BASE | Valsad. All Rights Reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default LandingPage;
