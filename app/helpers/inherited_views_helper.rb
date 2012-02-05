module InheritedViewsHelper
  def resource_title
    if respond_to?(:resource_class) && resource_class
      resource_class.name.split('::').last.titleize.downcase
    else
      'record'
    end
  end
end