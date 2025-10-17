import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, Shield, Clock, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MasterEDU
            </span>
          </h1>
          <p className="text-2xl text-slate-300 mb-4">
            Service Premium de Rédaction Académique
          </p>
          <p className="text-lg text-slate-400 mb-8">
            🎓 2,847 étudiants qui ont réussi
          </p>

          <Link to="/admin">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg">
              Accéder à l'Admin
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-white font-semibold mb-2">Garantie Qualité</h3>
            <p className="text-slate-400 text-sm">Remboursement si note &lt; 10/20</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-white font-semibold mb-2">Livraison Rapide</h3>
            <p className="text-slate-400 text-sm">De 3h à 7 jours selon urgence</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-white font-semibold mb-2">Experts Certifiés</h3>
            <p className="text-slate-400 text-sm">Rédacteurs académiques qualifiés</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-white font-semibold mb-2">Révisions Illimitées</h3>
            <p className="text-slate-400 text-sm">Modifications gratuites</p>
          </div>
        </div>

        <div className="mt-16 bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Comment ça marche ?</h2>
          
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Contactez notre bot Telegram</h3>
                <p className="text-slate-400">Démarrez une conversation avec @MasterEDUBot et décrivez votre besoin</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Choisissez vos options</h3>
                <p className="text-slate-400">Niveau académique, longueur et délai de livraison</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Paiement sécurisé</h3>
                <p className="text-slate-400">Payez par crypto (BTC, ETH, LTC, USDT)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Recevez votre travail</h3>
                <p className="text-slate-400">Livraison dans les délais avec révisions illimitées</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
