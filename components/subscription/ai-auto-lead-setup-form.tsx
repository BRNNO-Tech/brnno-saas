'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setupTwilioSubaccount, getAvailableAreaCodes } from '@/lib/actions/twilio-subaccounts'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Phone, Building2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
]

export default function AIAutoLeadSetupForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        businessName: '',
        legalName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        ein: '',
        ssn: '',
        contactEmail: '',
        areaCode: '',
        entityType: 'llc' // llc, corporation, sole_proprietor
    })
    const [availableAreaCodes, setAvailableAreaCodes] = useState<string[]>([])
    const [phoneNumber, setPhoneNumber] = useState('')

    const handleStateChange = async (state: string) => {
        setFormData(prev => ({ ...prev, state }))

        // Fetch available area codes for the selected state
        try {
            const areaCodes = await getAvailableAreaCodes(state)
            setAvailableAreaCodes(areaCodes)
        } catch (error) {
            console.error('Error fetching area codes:', error)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            // Validate required fields
            if (!formData.businessName || !formData.legalName || !formData.address ||
                !formData.city || !formData.state || !formData.zipCode || !formData.contactEmail) {
                toast.error('Please fill in all required fields')
                setLoading(false)
                return
            }

            // Validate EIN or SSN (at least one required)
            if (!formData.ein && !formData.ssn) {
                toast.error('Please provide either an EIN or SSN for business verification')
                setLoading(false)
                return
            }

            const result = await setupTwilioSubaccount({
                businessName: formData.businessName,
                legalName: formData.legalName,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                ein: formData.ein || undefined,
                ssn: formData.ssn || undefined,
                contactEmail: formData.contactEmail,
                areaCode: formData.areaCode || undefined
            })

            if (result.success) {
                setPhoneNumber(result.phoneNumber)
                toast.success(result.message)
                setStep(3) // Move to success step
            }
        } catch (error) {
            console.error('Setup error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to setup AI Auto Lead')
        } finally {
            setLoading(false)
        }
    }

    if (step === 3) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <CardTitle>Setup Complete!</CardTitle>
                            <CardDescription>Your AI Auto Lead is now active</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-100">Your Business Number</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{phoneNumber}</p>
                            </div>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-3">
                            This is your dedicated business phone number for SMS conversations with leads.
                        </p>
                    </div>

                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                            A2P Brand Registration in Progress
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Your business is being verified for A2P (Application-to-Person) messaging compliance.
                            This typically takes 2-4 weeks. You can start using your number immediately with some limitations.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={() => router.push('/dashboard/leads')}
                            className="w-full"
                        >
                            Go to Leads Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Setup AI Auto Lead</CardTitle>
                <CardDescription>
                    Complete your business information to get your dedicated phone number and enable AI-powered lead conversations.
                    <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                        One-time setup fee: $20 (includes phone number and A2P registration)
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6">
                    {/* Business Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            <Building2 className="h-4 w-4" />
                            <span>Business Information</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name (DBA) *</Label>
                            <Input
                                id="businessName"
                                value={formData.businessName}
                                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                placeholder="ABC Auto Detailing"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="legalName">Legal Business Name *</Label>
                            <Input
                                id="legalName"
                                value={formData.legalName}
                                onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                                placeholder="ABC Auto Detailing LLC"
                                required
                            />
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                Must match your business registration documents
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="entityType">Business Type *</Label>
                            <Select value={formData.entityType} onValueChange={(value) => setFormData(prev => ({ ...prev, entityType: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="llc">LLC</SelectItem>
                                    <SelectItem value="corporation">Corporation</SelectItem>
                                    <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ein">EIN {formData.entityType !== 'sole_proprietor' && '*'}</Label>
                            <Input
                                id="ein"
                                value={formData.ein}
                                onChange={(e) => setFormData(prev => ({ ...prev, ein: e.target.value }))}
                                placeholder="12-3456789"
                                maxLength={10}
                            />
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                Required for LLCs and Corporations
                            </p>
                        </div>

                        {formData.entityType === 'sole_proprietor' && (
                            <div className="space-y-2">
                                <Label htmlFor="ssn">SSN *</Label>
                                <Input
                                    id="ssn"
                                    type="password"
                                    value={formData.ssn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
                                    placeholder="XXX-XX-XXXX"
                                    maxLength={11}
                                />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Required for sole proprietors (encrypted and secure)
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email *</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                placeholder="owner@business.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Business Address */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            <MapPin className="h-4 w-4" />
                            <span>Business Address</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Street Address *</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="123 Main St"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Los Angeles"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Select value={formData.state} onValueChange={handleStateChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {US_STATES.map(state => (
                                            <SelectItem key={state.code} value={state.code}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code *</Label>
                            <Input
                                id="zipCode"
                                value={formData.zipCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                                placeholder="90001"
                                maxLength={5}
                                required
                            />
                        </div>
                    </div>

                    {/* Phone Number Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            <Phone className="h-4 w-4" />
                            <span>Phone Number (Optional)</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="areaCode">Preferred Area Code</Label>
                            {availableAreaCodes.length > 0 ? (
                                <Select value={formData.areaCode} onValueChange={(value) => setFormData(prev => ({ ...prev, areaCode: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose area code (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAreaCodes.map(code => (
                                            <SelectItem key={code} value={code}>
                                                ({code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="areaCode"
                                    value={formData.areaCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, areaCode: e.target.value }))}
                                    placeholder="Enter preferred area code (e.g., 310)"
                                    maxLength={3}
                                />
                            )}
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                We'll find a local number in your area. Leave blank for automatic selection.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting up your business number...
                            </>
                        ) : (
                            'Complete Setup'
                        )}
                    </Button>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                        By completing setup, you agree to pay the $20 one-time setup fee and monthly $49.99 subscription.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
