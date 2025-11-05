'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    kit_number: '',
    email: '',
    whatsapp_number: '',
    car_number_plate: '',
    house: '',
    profession: '',
    postal_address: '',
    attend_gala: '',
    morale: '',
    excited_for_gala: '',
    photo: null as File | null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Check if kit number already exists - CRITICAL: Only one kit number can register once
      const { data: existing, error: checkError } = await supabase
        .from('registrations')
        .select('kit_number')
        .eq('kit_number', formData.kit_number.trim())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine, any other error is a problem
        throw checkError;
      }

      if (existing) {
        setMessage({ 
          type: 'error', 
          text: `Kit number ${formData.kit_number} has already been registered! Each kit number can only be registered once.` 
        });
        setIsSubmitting(false);
        return;
      }

      // Upload photo if provided
      let photoUrl = '';
      if (formData.photo) {
        try {
          const fileExt = formData.photo.name.split('.').pop();
          const fileName = `${formData.kit_number.trim()}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, formData.photo);

          if (uploadError) {
            // Check if it's a bucket not found error
            const errorMessage = uploadError.message || '';
            if (errorMessage.includes('Bucket') || errorMessage.includes('bucket') || errorMessage.includes('not found') || errorMessage.includes('404')) {
              console.warn('Photo bucket not found, continuing without photo');
              // Continue without photo - registration can still be saved
              // Don't show error message here, we'll show success after registration
            } else {
              throw uploadError;
            }
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);

            photoUrl = publicUrl;
          }
        } catch (photoError: any) {
          // If photo upload fails but it's just a bucket issue, continue without photo
          if (photoError.message?.includes('Bucket') || photoError.message?.includes('bucket') || photoError.message?.includes('not found')) {
            console.warn('Photo bucket not found, continuing without photo');
            // photoUrl remains empty, registration will continue without photo
          } else {
            throw photoError;
          }
        }
      }

      // Insert registration
      const { error: insertError } = await supabase
        .from('registrations')
        .insert([{
          full_name: formData.full_name.trim(),
          kit_number: formData.kit_number.trim(),
          email: formData.email.trim(),
          whatsapp_number: formData.whatsapp_number.trim(),
          car_number_plate: formData.car_number_plate.trim() || 'N/A',
          house: formData.house,
          profession: formData.profession.trim(),
          postal_address: formData.postal_address.trim(),
          attend_gala: formData.attend_gala,
          morale: formData.morale,
          excited_for_gala: formData.excited_for_gala,
          photo_url: photoUrl,
        }]);

      if (insertError) {
        // Check if it's a unique constraint violation
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
          setMessage({ 
            type: 'error', 
            text: `Kit number ${formData.kit_number} has already been registered! Each kit number can only be registered once.` 
          });
        } else {
          throw insertError;
        }
        setIsSubmitting(false);
        return;
      }

      // Show success message - include note about photo if it wasn't uploaded
      const successMessage = photoUrl 
        ? 'Registration successful! We look forward to seeing you at the Gala.' 
        : 'Registration successful!';
      
      setMessage({ type: 'success', text: successMessage });
      
      // Reset form
      setFormData({
        full_name: '',
        kit_number: '',
        email: '',
        whatsapp_number: '',
        car_number_plate: '',
        house: '',
        profession: '',
        postal_address: '',
        attend_gala: '',
        morale: '',
        excited_for_gala: '',
        photo: null,
      });
      setPhotoPreview(null);
      const fileInput = document.getElementById('photo') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div className={`p-4 rounded-xl shadow-lg border-l-4 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 text-green-300 border-green-500' 
            : 'bg-gradient-to-r from-red-900/30 to-rose-900/30 text-red-300 border-red-500'
        } animate-slide-in`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <label htmlFor="full_name" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
          />
        </div>

        <div className="group">
          <label htmlFor="kit_number" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Kit Number <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="kit_number"
            name="kit_number"
            required
            value={formData.kit_number}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
            placeholder="Enter your kit number"
          />
        </div>

        <div className="group">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
          />
        </div>

        <div className="group">
          <label htmlFor="whatsapp_number" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            WhatsApp Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            id="whatsapp_number"
            name="whatsapp_number"
            required
            value={formData.whatsapp_number}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
          />
        </div>

        <div className="group">
          <label htmlFor="car_number_plate" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Car Number Plate <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="car_number_plate"
            name="car_number_plate"
            required
            placeholder="Enter plate number or N/A"
            value={formData.car_number_plate}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
          />
        </div>

        <div className="group">
          <label htmlFor="house" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            House <span className="text-red-400">*</span>
          </label>
          <select
            id="house"
            name="house"
            required
            value={formData.house}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
          >
            <option value="">Select House</option>
            <option value="Jinnah">Jinnah</option>
            <option value="Khushal">Khushal</option>
            <option value="Iqbal">Iqbal</option>
            <option value="Ayub">Ayub</option>
            <option value="Munawar">Munawar</option>
            <option value="Rustam">Rustam</option>
          </select>
        </div>

        <div className="md:col-span-2 group">
          <label htmlFor="profession" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Profession <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="profession"
            name="profession"
            required
            value={formData.profession}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
          />
        </div>

        <div className="md:col-span-2 group">
          <label htmlFor="postal_address" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Postal Address <span className="text-red-400">*</span>
          </label>
          <textarea
            id="postal_address"
            name="postal_address"
            required
            rows={3}
            value={formData.postal_address}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400 backdrop-blur-sm hover:border-gray-500 resize-none"
          />
        </div>

        <div className="group">
          <label htmlFor="attend_gala" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Do you want to attend the upcoming Gala? <span className="text-red-400">*</span>
          </label>
          <select
            id="attend_gala"
            name="attend_gala"
            required
            value={formData.attend_gala}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="group">
          <label htmlFor="morale" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            How&apos;s the morale? <span className="text-red-400">*</span>
          </label>
          <select
            id="morale"
            name="morale"
            required
            value={formData.morale}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
          >
            <option value="">Select</option>
            <option value="High Sir!">High Sir!</option>
            <option value="Upto Sky Sir!">Upto Sky Sir!</option>
          </select>
        </div>

        <div className="md:col-span-2 group">
          <label htmlFor="excited_for_gala" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Are you excited for 22nd November 2025 - Gala? <span className="text-red-400">*</span>
          </label>
          <select
            id="excited_for_gala"
            name="excited_for_gala"
            required
            value={formData.excited_for_gala}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 text-white backdrop-blur-sm hover:border-gray-500"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="Definitely Yes">Definitely Yes</option>
          </select>
        </div>

        <div className="md:col-span-2 group">
          <label htmlFor="photo" className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-indigo-400 transition-colors">
            Attach Your Photo <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="photo"
              name="photo"
              required
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-700/50 backdrop-blur-sm hover:border-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>
          {photoPreview && (
            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl border-2 border-indigo-500/30">
              <p className="text-sm font-medium text-gray-300 mb-2">Photo Preview:</p>
              <Image
                src={photoPreview}
                alt="Preview"
                width={200}
                height={200}
                className="rounded-xl object-cover border-2 border-indigo-400/30 shadow-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Registration
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    </form>
  );
}

