import React from "react";
import { AccessCard } from "@/components/landing/AccessCard";
import { FoodSlider } from "@/components/landing/FoodSlider";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, ShoppingBag, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

interface LandingProps {
  onLogin: () => void;
}

export function Landing({ onLogin }: LandingProps) {
  const navigate = useNavigate();
  const isTauri = "__TAURI__" in window;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-white to-white z-0" />

      {/* Desktop Admin Button */}
      {isTauri && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-lg hover:shadow-xl transition-all"
          >
            <Shield className="h-5 w-5" />
            Admin Access
          </Button>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Logo & Title */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div
            className="mx-auto mb-4 sm:mb-6 flex items-center justify-center"
            style={{ width: 260, height: 260 }}
          >
            <img
              src={logo}
              alt="Manna Palace Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Food Slider */}
        <div
          className="w-full mb-6 sm:mb-10 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <FoodSlider />
        </div>

        {/* Access Cards */}
        <div
          className="flex flex-col sm:flex-row justify-center items-stretch gap-4 w-full max-w-2xl px-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-full sm:w-72">
            <AccessCard type="cashier" onSuccess={onLogin} />
          </div>

          {/* Customer Self-Order Card - Desktop only */}
          {isTauri && (
            <div
              className="relative overflow-hidden hover-lift cursor-pointer group border-0 shadow-card hover:shadow-glow bg-gradient-to-br from-primary to-navy-dark rounded-lg w-full sm:w-72"
              onClick={() => navigate("/customer-order")}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />

              <div className="relative z-10 p-6 min-h-[240px] flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/20">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2 text-white">
                    Customer Self-Order
                  </h2>
                  <p className="text-sm mb-6 opacity-80 text-white">
                    Scan your barcode to place an order
                  </p>
                </div>
                <Button className="w-full font-semibold bg-blue-600 text-white hover:bg-blue-700">
                  Start Ordering
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform text-blue-400" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
