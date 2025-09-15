import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaFileContract, FaCheck } from "react-icons/fa";

interface BuyAlbumFormProps {
  isOpen: boolean;
  onClose: () => void;
  albumTitle: string;
  albumPrice: number;
  onSubmit: (formData: UserFormData) => void;
}

interface UserFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  consentForm: ConsentFormData;
}

interface ConsentFormData {
  artistName: string;
  songName: string;
  album: string;
  genre: string;
  independentLabel: string;
  initials: {
    grantOfAuthorization: string;
    ownershipCopyright: string;
    ironcladLicensing: string;
    useByAffiliates: string;
    waiverCompensation: string;
    warranties: string;
    indemnification: string;
    publicityPromotion: string;
    limitationLiability: string;
    arbitrationLegal: string;
    governingLaw: string;
    coverageFullWorks: string;
    entireAgreement: string;
  };
  copyrightOwnerName: string;
  copyrightOwnerSignature: string;
  copyrightOwnerDate: string;
  labelRepresentativeName: string;
  labelRepresentativeSignature: string;
  labelRepresentativeDate: string;
  agreedToTerms: boolean;
}

const BuyAlbumForm: React.FC<BuyAlbumFormProps> = ({
  isOpen,
  onClose,
  albumTitle,
  albumPrice,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    consentForm: {
      artistName: "",
      songName: "",
      album: "",
      genre: "",
      independentLabel: "",
      initials: {
        grantOfAuthorization: "",
        ownershipCopyright: "",
        ironcladLicensing: "",
        useByAffiliates: "",
        waiverCompensation: "",
        warranties: "",
        indemnification: "",
        publicityPromotion: "",
        limitationLiability: "",
        arbitrationLegal: "",
        governingLaw: "",
        coverageFullWorks: "",
        entireAgreement: "",
      },
      copyrightOwnerName: "",
      copyrightOwnerSignature: "",
      copyrightOwnerDate: "",
      labelRepresentativeName: "",
      labelRepresentativeSignature: "",
      labelRepresentativeDate: "",
      agreedToTerms: false,
    },
  });



  const handleConsentChange = (field: keyof ConsentFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      consentForm: {
        ...prev.consentForm,
        [field]: value,
      },
    }));
  };

  const handleInitialsChange = (field: keyof typeof formData.consentForm.initials, value: string) => {
    setFormData((prev) => ({
      ...prev,
      consentForm: {
        ...prev.consentForm,
        initials: {
          ...prev.consentForm.initials,
          [field]: value,
        },
      },
    }));
  };

  const handleConsentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.consentForm.agreedToTerms) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1834] text-white rounded-lg mt-16 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaFileContract className="text-[#66FCF1]" />
            Artist's Original Music Consent and Release Form
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-[#28344C] rounded">
          <div className="flex justify-between items-center">
           
            <p className="text-sm text-gray-300">
              This form is required for your music to be broadcast or distributed by Hallelujah Gospel Globally.
            </p>
          </div>
        </div>

        <form onSubmit={handleConsentSubmit} className="space-y-6">
            {/* Consent Form Content */}
            <div className="space-y-4 text-sm">
              <p>
                The undersigned Artist, Band, Independent Label, Recording Company, or Copyright Holder ("Copyright Owner") hereby grants Hallelujah Gospel Globally, a California Limited Liability Company, and its affiliates, licensees, successors, and assigns (collectively "Hallelujah Gospel Globally") the following rights and protections:
              </p>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">1. Grant of Authorization</h4>
                <p>The Copyright Owner hereby grants Hallelujah Gospel Globally the non-exclusive, royalty-free, worldwide right to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Broadcast, stream, and distribute the submitted original music via its websites, radio programming, and affiliate platforms;</li>
                  <li>Use excerpts of the work for promotional, news, or editorial purposes;</li>
                  <li>Store, archive, and reproduce the submitted work in any format for continued distribution.</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.grantOfAuthorization}
                    onChange={(e) => handleInitialsChange('grantOfAuthorization', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">2. Ownership and Copyright Representation</h4>
                <p>The Copyright Owner affirms that:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>The submitted recordings are original works or fully licensed by the undersigned;</li>
                  <li>All necessary rights and permissions for use, including from producers, writers, performers, or labels, have been secured.</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.ownershipCopyright}
                    onChange={(e) => handleInitialsChange('ownershipCopyright', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">3. Ironclad Licensing Protection and Outside Interference</h4>
                <p>This agreement supersedes any claim from outside licensing organizations, including but not limited to BMI, ASCAP, SESAC, SoundExchange, RIAA, or any other third-party collection or rights management agency.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.ironcladLicensing}
                    onChange={(e) => handleInitialsChange('ironcladLicensing', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">4. Use by Affiliates and Partners</h4>
                <p>Permission granted herein extends to all platforms owned, operated, or partnered with Hallelujah Gospel Globally, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Hallelujah Gospel Choice Radio</li>
                  <li>Hallelujah Gospel Globally's website and mobile apps</li>
                  <li>Live and virtual events, showcases, or affiliate airplay</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.useByAffiliates}
                    onChange={(e) => handleInitialsChange('useByAffiliates', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">5. Waiver of Compensation</h4>
                <p>The undersigned agrees that no payment is due for use of the submitted content under this agreement. This includes:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Airplay, performance, mechanical, or synchronization royalties</li>
                  <li>Public performance or streaming payouts</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.waiverCompensation}
                    onChange={(e) => handleInitialsChange('waiverCompensation', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 6 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">6. Warranties</h4>
                <p>The undersigned warrants that:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>They own and/or control 100% of the rights in the submitted materials;</li>
                  <li>They are not bound by any agreement that conflicts with this release;</li>
                  <li>All material is original and not a cover, sample, or derivative of another work;</li>
                  <li>No submission will trigger external claims or payments from licensing bodies;</li>
                  <li>Copyright Owner has the right and authority to license all rights granted herein.</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.warranties}
                    onChange={(e) => handleInitialsChange('warranties', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 7 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">7. Indemnification</h4>
                <p>The undersigned agrees to indemnify and hold harmless Hallelujah Gospel Globally and its representatives from any claims, damages, or losses arising out of the submitted content or the breach of this agreement.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.indemnification}
                    onChange={(e) => handleInitialsChange('indemnification', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 8 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">8. Publicity and Promotion Rights</h4>
                <p>The undersigned grants Hallelujah Gospel Globally the right to use artist and song information, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Names, logos, bios, photos, and album art</li>
                  <li>Song/album titles and credits</li>
                  <li>For all promotional, programming, or marketing use.</li>
                </ul>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.publicityPromotion}
                    onChange={(e) => handleInitialsChange('publicityPromotion', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 9 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">9. Limitation of Liability</h4>
                <p>Any liability by either party under this agreement is strictly limited to $100 USD. No party shall be liable for indirect or consequential damages.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.limitationLiability}
                    onChange={(e) => handleInitialsChange('limitationLiability', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 10 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">10. Arbitration and Legal Venue</h4>
                <p>Any disputes shall be resolved exclusively through binding arbitration in Contra Costa County, California, under the rules of the American Arbitration Association.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.arbitrationLegal}
                    onChange={(e) => handleInitialsChange('arbitrationLegal', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 11 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">11. Governing Law</h4>
                <p>This agreement is governed by the laws of the United States and the State of California.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.governingLaw}
                    onChange={(e) => handleInitialsChange('governingLaw', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 12 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">12. Coverage of Full Works</h4>
                <p>All tracks submitted via album, CD, or digital collection are covered under this agreement, including every track listed or embedded unless otherwise stated.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.coverageFullWorks}
                    onChange={(e) => handleInitialsChange('coverageFullWorks', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>

              {/* Section 13 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#66FCF1]">13. Entire Agreement</h4>
                <p>This form constitutes the entire agreement between the parties. No oral or external agreements shall alter the terms herein unless made in writing and signed by both parties.</p>
                <div className="flex items-center gap-2">
                  <span>Initial:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.consentForm.initials.entireAgreement}
                    onChange={(e) => handleInitialsChange('entireAgreement', e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-[#28344C] border border-gray-600 rounded text-center uppercase"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Song/Album Information */}
            <div className="bg-[#28344C] p-4 rounded">
              <h4 className="font-semibold mb-3 text-[#66FCF1]">Song/Album Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={formData.consentForm.artistName}
                    onChange={(e) => handleConsentChange('artistName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Song Name</label>
                  <input
                    type="text"
                    value={formData.consentForm.songName}
                    onChange={(e) => handleConsentChange('songName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Album</label>
                  <input
                    type="text"
                    value={formData.consentForm.album}
                    onChange={(e) => handleConsentChange('album', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                  <input
                    type="text"
                    value={formData.consentForm.genre}
                    onChange={(e) => handleConsentChange('genre', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Independent Label (if any)</label>
                  <input
                    type="text"
                    value={formData.consentForm.independentLabel}
                    onChange={(e) => handleConsentChange('independentLabel', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    placeholder="Leave blank if not applicable"
                  />
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-[#28344C] p-4 rounded">
              <h4 className="font-semibold mb-3 text-[#66FCF1]">Signature of Copyright Owner</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name (Print)</label>
                  <input
                    type="text"
                    value={formData.consentForm.copyrightOwnerName}
                    onChange={(e) => handleConsentChange('copyrightOwnerName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.consentForm.copyrightOwnerSignature}
                    onChange={(e) => handleConsentChange('copyrightOwnerSignature', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    placeholder="Type your full name as signature"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.consentForm.copyrightOwnerDate}
                    onChange={(e) => handleConsentChange('copyrightOwnerDate', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    required
                  />
                </div>
              </div>

              {/* Label Representative (Optional) */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h5 className="font-medium mb-2 text-gray-300">If Applicable: Label Representative</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name (Print)</label>
                    <input
                      type="text"
                      value={formData.consentForm.labelRepresentativeName}
                      onChange={(e) => handleConsentChange('labelRepresentativeName', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                      placeholder="Leave blank if not applicable"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Signature</label>
                    <input
                      type="text"
                      value={formData.consentForm.labelRepresentativeSignature}
                      onChange={(e) => handleConsentChange('labelRepresentativeSignature', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                      placeholder="Type full name as signature"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.consentForm.labelRepresentativeDate}
                      onChange={(e) => handleConsentChange('labelRepresentativeDate', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B1834] border border-gray-600 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreedToTerms"
                checked={formData.consentForm.agreedToTerms}
                onChange={(e) => handleConsentChange('agreedToTerms', e.target.checked)}
                className="mt-1 w-4 h-4 text-[#66FCF1] bg-[#28344C] border-gray-600 rounded focus:ring-[#66FCF1] focus:ring-2"
                required
              />
              <label htmlFor="agreedToTerms" className="text-sm text-gray-300">
                I have read, understood, and agree to all terms and conditions outlined in this Artist's Original Music Consent and Release Form. I confirm that I have the legal authority to enter into this agreement.
              </label>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!formData.consentForm.agreedToTerms}
                className="w-full bg-[#66FCF1] text-black py-3 rounded font-semibold hover:bg-[#53e6da] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaCheck />
                Agree & Continue to Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    );
};

export default BuyAlbumForm;
