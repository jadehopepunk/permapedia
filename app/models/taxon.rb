class Taxon < ActiveRecord::Base
  belongs_to :species
  
  validates :genus_name, :species_name, :presence => true
  
  def name
    [genus_name, species_name].reject(&:blank?).join(' ')
  end
  
  def to_s
    name
  end
end
