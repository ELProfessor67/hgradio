"use client";
import Breadcrum from '@/components/Breadcrum'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ButtonLoading } from '@/utils/Loading'
import { FaCreditCard, FaDollarSign, FaMoneyBillWave, FaCopy, FaCheckCircle } from 'react-icons/fa'


const methodsContent = {
    "cash": {
      heading: "Cash App Payment",
      content: "Please use this $Cashtag on your Cash App.",
      id: "$HallelujahGospel"
    },
    "zelle": {
      heading: "Zelle Payment",
      content: "Please use this Zelle number on your Zelle App.",
      id: "9255942138"
    },
    "venmo": {
      heading: "Venmo Payment",
      content: "Please use this Venmo number on your Venmo App.",
      id: "9255942138"
    },
}

const page = () => {
    const [loading, setLoading] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [copied, setCopied] = useState(false)
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        amount: "",
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    })

    const years = useMemo(() => {
        const current = new Date().getFullYear()
        return Array.from({ length: 12 }, (_, i) => String(current + i))
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copied to clipboard!', { style: { background: 'green', border: 'none', color: 'white' } })
        setTimeout(() => setCopied(false), 2000)
    }

    const validate = () => {
        if (!form.firstName.trim()) return "First name is required"
        if (!form.lastName.trim()) return "Last name is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Valid email is required"
        const amountNum = Number(form.amount)
        if (!amountNum || amountNum <= 0) return "Enter a valid amount"
        if (!/^\d{13,19}$/.test(form.cardNumber.replace(/\s+/g, ""))) return "Enter a valid card number"
        if (!/^\d{2}$/.test(form.expiryMonth) || Number(form.expiryMonth) < 1 || Number(form.expiryMonth) > 12) return "Enter valid expiry month"
        if (!/^\d{4}$/.test(form.expiryYear)) return "Enter valid expiry year"
        if (!/^\d{3,4}$/.test(form.cvv)) return "Enter valid CVV"
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const err = validate()
        if (err) {
            toast.error(err, { style: { background: 'red', border: 'none', color: 'white' } })
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact/process-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    amount: Number(form.amount),
                    cardNumber: form.cardNumber.replace(/\s+/g, ''),
                    expiryMonth: form.expiryMonth,
                    expiryYear: form.expiryYear,
                    cvv: form.cvv,
                })
            })
            const data = await res.json()
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || data?.message || 'Payment failed')
            }

            toast.success('Donation successful! Thank you!', { style: { background: 'green', border: 'none', color: 'white' } })
            setForm({ firstName: "", lastName: "", email: "", amount: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" })
        } catch (error) {
            toast.error(error.message || 'Something went wrong', { style: { background: 'red', border: 'none', color: 'white' } })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Breadcrum mainTitle="Partner With Us" subTitle="Partner With Us" />
            <div className=" bg-[#071126] text-[#fff] py-[3rem] ">
                <div className=" max-w-[900px] mx-auto px-3 ">
                    <h2 className=" text-[2.2rem] md:text-[2.6rem] font-semibold text-center pb-[1.5rem] ">Share Your Love Gift</h2>

                    <form onSubmit={handleSubmit} className=" space-y-6 bg-[#0b1834] p-5 md:p-8 ">
                        <div className=" flex items-center gap-4 ">
                            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                        </div>
                        <div className=" flex items-center gap-4 ">
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                            <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Amount (USD)" className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                        </div>

                        <div className=" grid md:grid-cols-2 grid-cols-1 gap-4 ">
                            <div className=" space-y-3 ">
                                <p className=" font-semibold flex items-center gap-2 "><FaCreditCard className=" text-second " /> Card Details</p>
                                <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="Card Number" inputMode="numeric" className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                                <div className=" flex items-center gap-4 ">
                                    <input name="expiryMonth" value={form.expiryMonth} onChange={handleChange} placeholder="MM" inputMode="numeric" maxLength={2} className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                                    <select name="expiryYear" value={form.expiryYear} onChange={handleChange} className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full ">
                                        <option value="">YYYY</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <input name="cvv" value={form.cvv} onChange={handleChange} placeholder="CVV" inputMode="numeric" maxLength={4} className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full " />
                                </div>
                            </div>
                            <div className=" space-y-3 bg-[#d9d9d9]/10 p-4 ">
                                <p className=" font-semibold ">Your Impact</p>
                                <ul className=" list-disc list-inside space-y-1 text-sm text-gray-200 ">
                                    <li>Expand our song library</li>
                                    <li>Enhance broadcasting equipment</li>
                                    <li>Support community outreach</li>
                                </ul>
                            </div>
                        </div>


                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-lg font-semibold mb-1">Or Choose Alternative Payment Method</p>
                                <p className="text-sm text-gray-400">Select your preferred payment method below</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod(selectedMethod === 'cash' ? null : 'cash')}
                                    className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${
                                        selectedMethod === 'cash'
                                            ? 'bg-second text-black'
                                            : 'bg-[#d9d9d9]/10 text-white hover:bg-[#d9d9d9]/20'
                                    }`}
                                >
                                    <FaDollarSign className="text-xl" />
                                    Cash App
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod(selectedMethod === 'zelle' ? null : 'zelle')}
                                    className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${
                                        selectedMethod === 'zelle'
                                            ? 'bg-second text-black'
                                            : 'bg-[#d9d9d9]/10 text-white hover:bg-[#d9d9d9]/20'
                                    }`}
                                >
                                    <FaMoneyBillWave className="text-xl" />
                                    Zelle
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod(selectedMethod === 'venmo' ? null : 'venmo')}
                                    className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${
                                        selectedMethod === 'venmo'
                                            ? 'bg-second text-black'
                                            : 'bg-[#d9d9d9]/10 text-white hover:bg-[#d9d9d9]/20'
                                    }`}
                                >
                                    <FaDollarSign className="text-xl" />
                                    Venmo
                                </button>
                            </div>

                            {selectedMethod && (
                                <div className="bg-[#d9d9d9]/10 p-6 space-y-3 transition-all duration-300 border-l-4 border-second">
                                    <h3 className="text-xl font-bold text-second">
                                        {methodsContent[selectedMethod].heading}
                                    </h3>
                                    <p className="text-gray-300">
                                        {methodsContent[selectedMethod].content}
                                    </p>
                                    <div className="flex items-center gap-3 bg-black/30 p-4 rounded">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-400 mb-1">
                                                {selectedMethod === 'cash' ? 'Cash Tag' : 'Phone Number'}
                                            </p>
                                            <p className="text-2xl font-bold text-second">
                                                {methodsContent[selectedMethod].id}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(methodsContent[selectedMethod].id)}
                                            className="bg-second hover:bg-second/80 text-black px-4 py-2 rounded font-semibold flex items-center gap-2 transition-all"
                                        >
                                            {copied ? (
                                                <>
                                                    <FaCheckCircle /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <FaCopy /> Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-400 italic">
                                        After making your payment, you can still fill out the form above to let us know about your donation.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className=" flex justify-center pt-[0.5rem] ">
                            <button type="submit" disabled={loading} className=" bg-second relative w-[12rem] h-[2.8rem] text-[#000] font-semibold ">
                                {loading ? <ButtonLoading /> : "Partner With Us"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page