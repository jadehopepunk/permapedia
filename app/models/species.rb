class Species < ActiveRecord::Base
  has_many :taxon, :dependent => :destroy
  
  def scientific_name
    taxon.first
  end
  
  def name
    scientific_name
  end
end
