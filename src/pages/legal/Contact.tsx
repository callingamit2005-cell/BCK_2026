import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import emailjs from '@emailjs/browser'; 
import { Send, ShieldCheck, Mail, ArrowLeft, CheckCircle2, Loader2, Headphones } from 'lucide-react';

const Contact = () => {
  const { t } = useLanguage();
  const form = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  
  // 🚀 Initialize EmailJS once when component mounts
  useEffect(() => {
    // Priority: Vercel Env > Hardcoded Key
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "W1G4v55M-A8H6XyWj";
    emailjs.init(publicKey);
    console.log('✅ BachatKaro Email Service Ready');
  }, []);

  const isFormValid = formData.name.trim() !== '' && 
                      formData.email.includes('@') && 
                      formData.message.trim().length > 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.current) return;
    if (!isFormValid) return;

    setIsSubmitting(true);

    // 🚀 IDs Fallback Logic (Agar Vercel par set nahi hai toh direct string use karega)
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_m3k2v9c";
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_nhqsc3r";
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "i8n4WHqeFRRWpjXtX";

    try {
      const result = await emailjs.sendForm(
        serviceID, 
        templateID, 
        form.current, 
        publicKey
      );
      
      console.log('✅ Message Delivered:', result.text);
      
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      if (form.current) {
        form.current.reset();
      }
      
      setTimeout(() => setSubmitted(false), 6000);
      
    } catch (error: any) {
      console.error('❌ Email Error:', error);
      alert("Oops! Message nahi bhej paye. Please internet check karke wapas try karein.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-16 px-6 bg-white animate-fade-in font-body selection:bg-primary/20">
      <div className="max-w-6xl mx-auto">
        
        {/* 🔙 Back Button */}
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 text-slate-900 font-black hover:text-primary transition-all active:scale-[0.965] group"
          >
            <div className="p-3 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors border border-slate-200">
              <ArrowLeft size={22} />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest">{t('btn_back_home', 'Home')}</span>
          </Link>
        </div>

        {/* 🏆 Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight italic">
            Contact <span className="text-primary underline decoration-primary/30">Us</span>
          </h1>
          <p className="text-slate-800 text-xl max-w-2xl mx-auto font-bold leading-relaxed italic underline decoration-primary/10 underline-offset-8">
            Team BachatKaro is always here to help you. You are our family.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          <div className="space-y-6 lg:col-span-1">
            <div className="p-8 rounded-[32px] border-2 border-slate-200 bg-slate-50 shadow-sm transition-all hover:border-primary/40 hover:shadow-md group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="text-primary" size={32} />
              </div>
              <h3 className="text-slate-900 font-black text-2xl mb-2">Email Support</h3>
              <p className="text-slate-600 font-mono text-sm break-all">help@bachatkaro.co.in</p>
            </div>
            
            <div className="p-8 rounded-[32px] border-2 border-slate-200 bg-slate-50 shadow-sm transition-all hover:border-primary/40 hover:shadow-md group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Headphones className="text-primary" size={32} />
              </div>
              <h3 className="text-slate-900 font-black text-2xl mb-2 italic underline decoration-primary/10">Help Center</h3>
              <p className="text-slate-600 font-bold tracking-tight">Available 24/7 for smart savers.</p>
            </div>
          </div>

          <div className="lg:col-span-2 p-8 md:p-12 rounded-[40px] border-4 border-slate-900 bg-white shadow-[20px_20px_0px_0px_rgba(15,23,42,0.05)] relative overflow-hidden">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={56} className="text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 italic">Message Sent!</h2>
                <p className="text-slate-700 font-bold mt-2 text-lg italic tracking-tight">
                  Check your email for confirmation. Team BachatKaro will contact you shortly.
                </p>
              </div>
            ) : (
              <form ref={form} onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 ml-1">Full Name</label>
                    <input 
                      required
                      name="name" 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:border-primary focus:bg-white outline-none transition-all placeholder:italic placeholder:text-slate-300"
                      placeholder="Amit Mishra"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 ml-1 italic">Email ID</label>
                    <input 
                      required
                      name="email" 
                      type="email" 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:border-primary focus:bg-white outline-none transition-all placeholder:italic placeholder:text-slate-300"
                      placeholder="help@bachatkaro.co.in"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 ml-1">Message</label>
                  <textarea 
                    required
                    name="message" 
                    rows={5}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:border-primary focus:bg-white outline-none transition-all resize-none placeholder:italic placeholder:text-slate-300"
                    placeholder="How can Team BachatKaro help you today?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                  <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" /> 
                    Secure & Direct Support
                  </p>
                  <button 
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="w-full md:w-auto px-12 py-5 bg-slate-900 hover:bg-primary text-white rounded-[22px] font-black text-xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={24} className="animate-spin" /> 
                        <span className="tracking-widest uppercase">SENDING...</span>
                      </>
                    ) : (
                      <>
                        <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                        <span className="tracking-widest uppercase">SEND MESSAGE</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
