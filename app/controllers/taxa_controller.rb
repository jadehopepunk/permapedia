class TaxaController < InheritedResources::Base
  actions :all, :except => :show
end