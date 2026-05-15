import React from 'react';
import { HelpCircle } from 'lucide-react';
import MetaData from '../components/MetaData';

const FAQ = () => {
  const faqs = [
    {
      question: "How does the AI detect defects?",
      answer: "Our system uses a custom-trained YOLO computer vision model to analyze pixels and identify anomalies like scratches, cracks, and dead pixels on screens."
    },
    {
      question: "What is the difference between Single and Batch scan?",
      answer: "Single scan allows you to upload and immediately review one device. Batch scan lets you upload multiple images at once (like a whole shipment) and processes them in the background."
    },
    {
      question: "Can I download a report of the scan?",
      answer: "Yes. Navigate to your History page, locate the specific scan, and click the 'Download Report' button to generate a certified PDF."
    }
  ];

  return (
    <>
    <MetaData 
        title="FAQ" 
        description="Frequently Asked Questions about ScreenSense AI inspection system." 
      />
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 p-6">
      <div className="text-center flex justify-center items-center gap-5">
        <div className="inline-flex items-center justify-center p-3 bg-violet-100 text-violet-700 rounded-2xl">
          <HelpCircle size={32} />
        </div>
        <div>
        <h1 className="text-3xl font-bold text-slate-800">Frequently Asked Questions</h1>
        <p className="text-slate-500">Everything you need to know about using the inspection system.</p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2 text-lg">{faq.question}</h3>
            <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default FAQ;



