"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, User, CheckCircle, Loader2, AlertCircle, Camera, X, RefreshCw, Check, AlertCircle as AlertIcon } from "lucide-react";
import AuthHeader from "@/components/AuthHeader";

const HIGH_RISK_COUNTRIES = ["KP", "IR", "SY", "CU", "VE", "MM"];
const SANCTIONED_NAMES = ["KIM", "PUTIN", "MADURO"];

type DocKey = "idFront" | "idBack" | "selfie";

interface DocState {
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

interface PreviewState {
  idFront: string;
  idBack: string;
  selfie: string;
}

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    phone: "",
    address: "",
    country: "PH",
    pep: "no",
  });

  const [files, setFiles] = useState<DocState>({ idFront: null, idBack: null, selfie: null });
  const [previews, setPreviews] = useState<PreviewState>({ idFront: "", idBack: "", selfie: "" });

  // Validation state
  const [valid, setValid] = useState({
    firstName: false,
    lastName: false,
    dob: false,
    phone: false,
    address: false,
    pep: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState<DocKey | null>(null);

  const docs = [
    { k: "idFront" as const, l: "ID Front" },
    { k: "idBack" as const, l: "ID Back" },
    { k: "selfie" as const, l: "Selfie with ID" },
  ];

  // IMAGE COMPRESSION
  const compressImage = async (file: File): Promise<File> => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    return new Promise((resolve) => {
      img.onload = () => {
        const maxSize = 1200;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } 
        else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, { type: "image/jpeg" });
            resolve(compressed.size < 1024 * 1024 ? compressed : file); // fallback
          }
        }, "image/jpeg", 0.8);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const upload = async (key: DocKey, file: File) => {
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setPreviews(p => ({ ...p, [key]: url }));
    setFiles(f => ({ ...f, [key]: compressed }));
  };

  const startCamera = async (key: DocKey) => {
    setCapturing(key);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } 
    catch {
      toast.error("Camera access denied");
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !capturing) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const video = videoRef.current;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `${capturing}.jpg`, { type: "image/jpeg" });
        await upload(capturing, file);
        stopCamera();
        setCapturing(null);
      }
    }, "image/jpeg");
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // REAL-TIME VALIDATION
  useEffect(() => {
    const age = form.dob ? new Date().getFullYear() - new Date(form.dob).getFullYear() : 0;
    const is18 = age >= 18;

    setValid({
      firstName: form.firstName.trim().length > 0,
      lastName: form.lastName.trim().length > 0,
      dob: Boolean(form.dob && is18),
      phone: /^\+?[0-9]{10,15}$/.test(form.phone),
      address: form.address.trim().length > 0,
      pep: form.pep !== "yes",
    });
  }, [form]);

  const isStep1Valid = Object.values(valid).every(Boolean);
  const isStep2Valid = files.idFront && files.idBack && files.selfie;

  const finalAMLCheck = () => {
    const fullName = `${form.firstName} ${form.middleName} ${form.lastName}`.trim().toUpperCase();
    if (HIGH_RISK_COUNTRIES.includes(form.country)) return toast.error("Country not supported");
    if (SANCTIONED_NAMES.some(n => fullName.includes(n))) return toast.error("Name restricted");
    return true;
  };

  const submit = async () => {
    if (!finalAMLCheck()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    toast.success("KYC submitted for review");
    setVerified(true);
    setTimeout(() => router.push("/wallet"), 1500);
    setSubmitting(false);
  };

  useEffect(() => () => stopCamera(), []);

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
        <AuthHeader />
        <Card className="max-w-md w-full text-center p-8 shadow-2xl">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-emerald-800">KYC Verified</h2>
          <p className="text-gray-600 mt-2">Full access unlocked</p>
          <Button className="mt-6 w-full h-12 text-lg font-semibold" onClick={() => router.push("/wallet")}>
            Go to Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <AuthHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center p-6">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              <User className="h-9 w-9" />
              KYC / AML Verification
            </CardTitle>
            <p className="text-emerald-50 mt-2 text-sm">Secure. Fast. Compliant.</p>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="mb-8">
              <Progress value={(step / 3) * 100} className="h-3 rounded-full" />
              <div className="flex justify-between mt-3 text-sm font-medium text-gray-700">
                <span className={step === 1 ? "text-emerald-600" : ""}>Personal</span>
                <span className={step === 2 ? "text-emerald-600" : ""}>Documents</span>
                <span className={step === 3 ? "text-emerald-600" : ""}>Review</span>
              </div>
            </div>

            {/* STEP 1: Personal */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                    <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" className={`mt-1 ${valid.firstName ? "border-green-500" : "border-red-500"}`} />
                    {form.firstName && (valid.firstName ? <Check className="absolute right-3 top-9 h-4 w-4 text-green-500" /> : <AlertIcon className="absolute right-3 top-9 h-4 w-4 text-red-500" />)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Middle Name</Label>
                    <Input value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="Santos" className="mt-1" />
                  </div>
                  <div className="relative">
                    <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                    <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dela Cruz" className={`mt-1 ${valid.lastName ? "border-green-500" : "border-red-500"}`} />
                    {form.lastName && (valid.lastName ? <Check className="absolute right-3 top-9 h-4 w-4 text-green-500" /> : <AlertIcon className="absolute right-3 top-9 h-4 w-4 text-red-500" />)}
                  </div>
                  <div className="relative">
                    <Label className="text-sm font-medium text-gray-700">Date of Birth *</Label>
                    <Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className={`mt-1 ${valid.dob ? "border-green-500" : "border-red-500"}`} />
                    {form.dob && (valid.dob ? <Check className="absolute right-3 top-9 h-4 w-4 text-green-500" /> : <AlertIcon className="absolute right-3 top-9 h-4 w-4 text-red-500" />)}
                  </div>
                  <div className="relative">
                    <Label className="text-sm font-medium text-gray-700">Phone *</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+639..." className={`mt-1 ${valid.phone ? "border-green-500" : "border-red-500"}`} />
                    {form.phone && (valid.phone ? <Check className="absolute right-3 top-9 h-4 w-4 text-green-500" /> : <AlertIcon className="absolute right-3 top-9 h-4 w-4 text-red-500" />)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Country</Label>
                    <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PH">Philippines</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="SG">Singapore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 relative">
                    <Label className="text-sm font-medium text-gray-700">Full Address *</Label>
                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Manila" className={`mt-1 ${valid.address ? "border-green-500" : "border-red-500"}`} />
                    {form.address && (valid.address ? <Check className="absolute right-3 top-9 h-4 w-4 text-green-500" /> : <AlertIcon className="absolute right-3 top-9 h-4 w-4 text-red-500" />)}
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-sm font-medium text-gray-700">Are you a PEP? *</Label>
                    <Select value={form.pep} onValueChange={v => setForm({ ...form, pep: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-12 text-lg font-semibold" 
                  disabled={!isStep1Valid}
                  onClick={() => setStep(2)}
                >
                  Next: Upload Documents
                </Button>
              </div>
            )}

            {/* STEP 2: Documents */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Upload ID & Selfie</h3>
                <p className="text-sm text-gray-600">Images auto-compressed. Max 1MB.</p>

                {capturing && (
                  <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={stopCamera}>
                      <X className="h-8 w-8" />
                    </Button>
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-xl shadow-2xl" />
                    <Button size="lg" className="mt-6 h-14 px-8 text-lg font-bold" onClick={capture}>
                      <Camera className="mr-3 h-6 w-6" /> Capture
                    </Button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                  {docs.map(({ k, l }) => (
                    <div key={k} className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Upload className="h-4 w-4" /> {l} *
                      </Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startCamera(k)} className="flex-1 h-10">
                          <Camera className="h-4 w-4 mr-1" /> Camera
                        </Button>
                        <Input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(k, e.target.files[0])} className="hidden" id={`file-${k}`} />
                        <Label htmlFor={`file-${k}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full h-10">Upload</Button>
                        </Label>
                      </div>
                      {previews[k] ? (
                        <div className="relative group">
                          <img src={previews[k]} alt="" className="h-40 w-full object-cover rounded-lg border-2 border-emerald-200 shadow-md" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setPreviews(p => ({ ...p, [k]: "" }));
                              setFiles(f => ({ ...f, [k]: null }));
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                          <Upload className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 h-12 text-lg font-semibold"
                    disabled={!isStep2Valid}
                    onClick={() => setStep(3)}
                  >
                    Review & Submit
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Review & Submit</h3>
                <Card className="bg-emerald-50/50 border-emerald-200">
                  <CardContent className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-medium">Name:</span><span>{form.firstName} {form.middleName} {form.lastName}</span></div>
                    <div className="flex justify-between"><span className="font-medium">DOB:</span><span>{form.dob}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Country:</span><span>{form.country}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Documents:</span>
                      <Badge variant="default" className="bg-emerald-600">
                        {Object.values(files).filter(Boolean).length}/3 Complete
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>By submitting, you agree to our AML policy and data processing. Verification takes 1–3 business days.</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button size="lg" className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={submit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                    Submit for Verification
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}